import os
import asyncio
import logging
import uuid
import json
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional, List
from contextlib import asynccontextmanager

import bcrypt
import jwt
import resend
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel, EmailStr, Field
import redis.asyncio as redis

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.environ.get("MONGODB_DB", "essencia")
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
REDIS_CHANNEL = os.environ.get("REDIS_CHANNEL", "essencia:events")
RESEND_API_KEY = os.environ["RESEND_API_KEY"]
SENDER_EMAIL = os.environ["SENDER_EMAIL"]
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Admin")
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
APP_URL = os.environ.get("APP_URL", "http://localhost:3001")
INSTANCE_ID = uuid.uuid4().hex

resend.api_key = RESEND_API_KEY

mongo_client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None
redis_client: Optional[redis.Redis] = None
redis_listener_task: Optional[asyncio.Task] = None


# ============== Seed Data ==============
SEED_PRODUCTS = [
    {
        "id": "acqua-di-gio",
        "name": "Acqua di Gio Eau de Parfum",
        "description": "Bright citrus and marine freshness with soft woods and musk.",
        "price": 399,
        "image": "https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/perfumes/acqua_di_gio.png",
        "badge": "Bestseller",
        "category": "Perfumes",
        "gender": "All Genders",
        "stock": 25,
        "size": "100ml",
    },
    {
        "id": "versace-eros",
        "name": "Versace Eros Eau de Parfum",
        "description": "Minty apple sweetness with creamy vanilla and warm woods.",
        "price": 399,
        "image": "https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/perfumes/versace_eros.png",
        "badge": "Bestseller",
        "category": "Perfumes",
        "gender": "Male",
        "stock": 18,
        "size": "100ml",
    },
    {
        "id": "creed-aventus",
        "name": "Creed Aventus Eau de Parfum",
        "description": "Juicy pineapple and smoky birch with rich musk and oakmoss.",
        "price": 399,
        "image": "https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/perfumes/aventus.png",
        "badge": "Bestseller",
        "category": "Perfumes",
        "gender": "Male",
        "stock": 12,
        "size": "100ml",
    },
    {
        "id": "pacco-rabanne-one-mil",
        "name": "Paco Rabanne 1 Million Eau de Parfum",
        "description": "Sweet citrus and cinnamon spice with a warm leather base.",
        "price": 399,
        "image": "https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/perfumes/pacco_rabanne_one_mil.png",
        "badge": "Bestseller",
        "category": "Perfumes",
        "gender": "All Genders",
        "stock": 20,
        "size": "100ml",
    },
]

SEED_BANKS = [
    {
        "id": "00000000-0000-0000-0000-000000000001",
        "name": "GCash",
        "account_name": "Essencia Perfume",
        "account_number": "09171234567",
        "qr_image": "",
    }
]


# ============== Realtime ==============
class RealtimeManager:
    def __init__(self):
        self.admin_connections: set[WebSocket] = set()
        self.order_connections: dict[str, set[WebSocket]] = {}

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.add(websocket)

    def disconnect_admin(self, websocket: WebSocket):
        self.admin_connections.discard(websocket)

    async def connect_order(self, order_id: str, websocket: WebSocket):
        await websocket.accept()
        self.order_connections.setdefault(order_id, set()).add(websocket)

    def disconnect_order(self, order_id: str, websocket: WebSocket):
        connections = self.order_connections.get(order_id)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            self.order_connections.pop(order_id, None)

    async def broadcast(self, event: dict):
        await self._send_many(self.admin_connections, event)
        order_id = event.get("order_id")
        if order_id:
            await self._send_many(self.order_connections.get(str(order_id), set()), event)

    async def _send_many(self, connections: set[WebSocket], event: dict):
        disconnected = []
        for websocket in list(connections):
            try:
                await websocket.send_json(event)
            except Exception:
                disconnected.append(websocket)
        for websocket in disconnected:
            connections.discard(websocket)


realtime_manager = RealtimeManager()


async def publish_event(event: dict):
    await realtime_manager.broadcast(event)
    if not redis_client:
        return
    try:
        payload = {**event, "source_id": INSTANCE_ID}
        await redis_client.publish(REDIS_CHANNEL, json.dumps(payload, default=str))
    except Exception as exc:
        logger.warning("Redis publish failed: %s", exc)


async def _listen_for_redis_events():
    if not redis_client:
        return
    pubsub = redis_client.pubsub()
    try:
        await pubsub.subscribe(REDIS_CHANNEL)
        async for message in pubsub.listen():
            if message.get("type") != "message":
                continue
            event = json.loads(message["data"])
            if event.get("source_id") == INSTANCE_ID:
                continue
            event.pop("source_id", None)
            await realtime_manager.broadcast(event)
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        logger.warning("Redis listener stopped: %s", exc)
    finally:
        await pubsub.close()


# ============== DB Init ==============
async def init_db():
    await db.admins.create_index("email", unique=True)
    await db.products.create_index("category")
    await db.products.create_index("gender")
    await db.products.create_index("created_at")
    await db.banks.create_index("created_at")
    await db.promo_codes.create_index("code_normalized", unique=True)
    await db.promo_codes.create_index("created_at")
    await db.orders.create_index("created_at")
    await db.orders.create_index("status")

    existing = await db.admins.find_one({"email": ADMIN_EMAIL})
    if not existing:
        pw_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
        await db.admins.insert_one(
            {
                "_id": str(uuid.uuid4()),
                "email": ADMIN_EMAIL,
                "password_hash": pw_hash,
                "name": ADMIN_NAME,
                "created_at": _utc_now(),
            }
        )
        logger.info("Seeded admin: %s", ADMIN_EMAIL)

    for p in SEED_PRODUCTS:
        await db.products.update_one(
            {"_id": p["id"]},
            {
                "$setOnInsert": {
                    "_id": p["id"],
                    "name": p["name"],
                    "description": p["description"],
                    "price": p["price"],
                    "original_price": p.get("original_price"),
                    "image": p["image"],
                    "badge": p.get("badge"),
                    "category": p["category"],
                    "gender": p.get("gender", "All Genders"),
                    "stock": p["stock"],
                    "size": p["size"],
                    "created_at": _utc_now(),
                    "updated_at": _utc_now(),
                }
            },
            upsert=True,
        )

    for b in SEED_BANKS:
        await db.banks.update_one(
            {"_id": b["id"]},
            {
                "$setOnInsert": {
                    "_id": b["id"],
                    "name": b["name"],
                    "account_name": b["account_name"],
                    "account_number": b["account_number"],
                    "qr_image": b["qr_image"],
                    "created_at": _utc_now(),
                }
            },
            upsert=True,
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    global mongo_client, db, redis_client, redis_listener_task
    mongo_client = AsyncIOMotorClient(MONGODB_URI)
    db = mongo_client[MONGODB_DB]
    await init_db()
    logger.info("Mongo database initialized: %s", MONGODB_DB)

    try:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        await redis_client.ping()
        redis_listener_task = asyncio.create_task(_listen_for_redis_events())
        logger.info("Redis realtime connected")
    except Exception as exc:
        redis_client = None
        logger.warning("Redis unavailable; realtime will be local-only: %s", exc)

    yield

    if redis_listener_task:
        redis_listener_task.cancel()
        try:
            await redis_listener_task
        except asyncio.CancelledError:
            pass
    if redis_client:
        await redis_client.aclose()
    mongo_client.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ============== Models ==============
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    admin: dict


class ProductIn(BaseModel):
    id: Optional[str] = None
    name: str
    description: str = ""
    price: float
    original_price: Optional[float] = None
    image: str = ""
    badge: Optional[str] = None
    category: str = "Perfumes"
    gender: Literal["Male", "Female", "All Genders"] = "All Genders"
    stock: int = 0
    size: str = ""


class BankIn(BaseModel):
    name: str
    account_name: str = ""
    account_number: str = ""
    qr_image: str = ""


class PromoCodeIn(BaseModel):
    code: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    starts_at: datetime
    ends_at: datetime
    active: bool = True


class PromoCodeApplyIn(BaseModel):
    code: str = Field(..., min_length=1)
    subtotal: float = Field(0, ge=0)


class CartItemIn(BaseModel):
    id: str
    name: str
    description: str = ""
    price: float
    quantity: int
    image: str = ""
    size: Optional[str] = ""


class OrderIn(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str = ""
    province: str = Field(..., min_length=1)
    town_city: str = Field(..., min_length=1)
    barangay: str = Field(..., min_length=1)
    street_house_no: str = Field(..., min_length=1)
    zipcode: str = Field(..., min_length=1)
    facebook_account: str = Field(..., min_length=1)
    waybill: str = ""
    shipping_mode: Literal["LBC", "J&T"]
    items: List[CartItemIn]
    subtotal: float
    total: float
    promo_code: str = ""
    promo_discount: float = 0
    bank_id: str
    bank_name: str
    payment_proof: str


class ShippingConfirmIn(BaseModel):
    waybill: str = Field(..., min_length=1)
    shipment_fee: float = Field(0, ge=0)


# ============== Auth Helpers ==============
def create_token(admin_id: str, email: str) -> str:
    payload = {
        "sub": admin_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return await _admin_from_token(credentials.credentials)


async def _admin_from_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    admin = await db.admins.find_one({"_id": payload["sub"]}, {"password_hash": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return {"id": admin["_id"], "email": admin["email"], "name": admin["name"]}


# ============== WebSockets ==============
@app.websocket("/ws/admin")
async def admin_ws(websocket: WebSocket, token: str):
    try:
        await _admin_from_token(token)
    except HTTPException:
        await websocket.close(code=1008)
        return
    await realtime_manager.connect_admin(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_manager.disconnect_admin(websocket)


@app.websocket("/ws/orders/{order_id}")
async def order_ws(websocket: WebSocket, order_id: str):
    await realtime_manager.connect_order(order_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_manager.disconnect_order(order_id, websocket)


# ============== Routes ==============
@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/admin/login", response_model=TokenResponse)
async def admin_login(req: LoginRequest):
    row = await db.admins.find_one({"email": req.email})
    if not row or not bcrypt.checkpw(req.password.encode(), row["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(row["_id"], row["email"])
    return {
        "access_token": token,
        "admin": {"id": row["_id"], "email": row["email"], "name": row["name"]},
    }


@app.get("/api/admin/me")
async def get_me(admin=Depends(get_current_admin)):
    return admin


# Products ---
@app.get("/api/products")
async def list_products(
    category: Optional[str] = None,
    gender: Optional[str] = None,
    limit: Optional[int] = Query(default=None, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
):
    query = {}
    if category and category.lower() != "all":
        query["category"] = category
    if gender and gender.lower() != "all":
        query["gender"] = gender
    if limit is None:
        rows = await db.products.find(query).sort("created_at", -1).to_list(length=None)
        return [_doc_to_product(r) for r in rows]

    total = await db.products.count_documents(query)
    rows = await db.products.aggregate(
        [
            {"$match": query},
            {
                "$addFields": {
                    "_display_in_stock": {"$cond": [{"$gt": ["$stock", 0]}, 1, 0]},
                    "_display_bestseller": {
                        "$cond": [
                            {"$eq": [{"$toLower": {"$ifNull": ["$badge", ""]}}, "bestseller"]},
                            1,
                            0,
                        ]
                    },
                }
            },
            {"$sort": {"_display_in_stock": -1, "_display_bestseller": -1, "created_at": -1}},
            {"$skip": offset},
            {"$limit": limit},
            {"$project": {"_display_in_stock": 0, "_display_bestseller": 0}},
        ]
    ).to_list(length=limit)
    return _product_page_response([_doc_to_product(r) for r in rows], total, limit, offset)


@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    row = await db.products.find_one({"_id": product_id})
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return _doc_to_product(row)


@app.post("/api/admin/products")
async def create_product(p: ProductIn, admin=Depends(get_current_admin)):
    pid = p.id or _slugify(p.name) + "-" + uuid.uuid4().hex[:6]
    now = _utc_now()
    doc = {
        "_id": pid,
        "name": p.name,
        "description": p.description,
        "price": p.price,
        "original_price": p.original_price,
        "image": p.image,
        "badge": p.badge,
        "category": p.category,
        "gender": p.gender,
        "stock": p.stock,
        "size": p.size,
        "created_at": now,
        "updated_at": now,
    }
    try:
        await db.products.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Product id already exists")
    product = _doc_to_product(doc)
    await publish_event({"type": "products.changed", "product": product})
    return product


@app.put("/api/admin/products/{product_id}")
async def update_product(product_id: str, p: ProductIn, admin=Depends(get_current_admin)):
    result = await db.products.update_one(
        {"_id": product_id},
        {
            "$set": {
                "name": p.name,
                "description": p.description,
                "price": p.price,
                "original_price": p.original_price,
                "image": p.image,
                "badge": p.badge,
                "category": p.category,
                "gender": p.gender,
                "stock": p.stock,
                "size": p.size,
                "updated_at": _utc_now(),
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    row = await db.products.find_one({"_id": product_id})
    product = _doc_to_product(row)
    await publish_event({"type": "products.changed", "product": product})
    return product


@app.delete("/api/admin/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_current_admin)):
    result = await db.products.delete_one({"_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    await publish_event({"type": "products.changed", "product_id": product_id, "deleted": True})
    return {"deleted": True}


# Banks ---
@app.get("/api/banks")
async def list_banks():
    rows = await db.banks.find({}).sort("created_at", 1).to_list(length=None)
    return [_doc_to_bank(r) for r in rows]


@app.post("/api/admin/banks")
async def create_bank(b: BankIn, admin=Depends(get_current_admin)):
    doc = {
        "_id": str(uuid.uuid4()),
        "name": b.name,
        "account_name": b.account_name,
        "account_number": b.account_number,
        "qr_image": b.qr_image,
        "created_at": _utc_now(),
    }
    await db.banks.insert_one(doc)
    bank = _doc_to_bank(doc)
    await publish_event({"type": "banks.changed", "bank": bank})
    return bank


@app.put("/api/admin/banks/{bank_id}")
async def update_bank(bank_id: str, b: BankIn, admin=Depends(get_current_admin)):
    _validate_uuid(bank_id)
    result = await db.banks.update_one(
        {"_id": bank_id},
        {"$set": {"name": b.name, "account_name": b.account_name, "account_number": b.account_number, "qr_image": b.qr_image}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bank not found")
    row = await db.banks.find_one({"_id": bank_id})
    bank = _doc_to_bank(row)
    await publish_event({"type": "banks.changed", "bank": bank})
    return bank


@app.delete("/api/admin/banks/{bank_id}")
async def delete_bank(bank_id: str, admin=Depends(get_current_admin)):
    _validate_uuid(bank_id)
    result = await db.banks.delete_one({"_id": bank_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bank not found")
    await publish_event({"type": "banks.changed", "bank_id": bank_id, "deleted": True})
    return {"deleted": True}


# Promo Codes ---
@app.get("/api/admin/promo-codes")
async def list_promo_codes(admin=Depends(get_current_admin)):
    rows = await db.promo_codes.find({}).sort("created_at", -1).to_list(length=None)
    return [_doc_to_promo_code(r) for r in rows]


@app.post("/api/admin/promo-codes")
async def create_promo_code(p: PromoCodeIn, admin=Depends(get_current_admin)):
    _validate_promo_code_range(p.starts_at, p.ends_at)
    now = _utc_now()
    code = p.code.strip()
    doc = {
        "_id": str(uuid.uuid4()),
        "code": code,
        "code_normalized": _normalize_promo_code(code),
        "amount": float(p.amount),
        "starts_at": _ensure_utc(p.starts_at),
        "ends_at": _ensure_utc(p.ends_at),
        "active": bool(p.active),
        "created_at": now,
        "updated_at": now,
    }
    try:
        await db.promo_codes.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    promo = _doc_to_promo_code(doc)
    await publish_event({"type": "promo_codes.changed", "promo_code": promo})
    return promo


@app.put("/api/admin/promo-codes/{promo_code_id}")
async def update_promo_code(promo_code_id: str, p: PromoCodeIn, admin=Depends(get_current_admin)):
    _validate_promo_code_range(p.starts_at, p.ends_at)
    now = _utc_now()
    code = p.code.strip()
    try:
        result = await db.promo_codes.update_one(
            {"_id": promo_code_id},
            {
                "$set": {
                    "code": code,
                    "code_normalized": _normalize_promo_code(code),
                    "amount": float(p.amount),
                    "starts_at": _ensure_utc(p.starts_at),
                    "ends_at": _ensure_utc(p.ends_at),
                    "active": bool(p.active),
                    "updated_at": now,
                }
            },
        )
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    row = await db.promo_codes.find_one({"_id": promo_code_id})
    promo = _doc_to_promo_code(row)
    await publish_event({"type": "promo_codes.changed", "promo_code": promo})
    return promo


@app.post("/api/admin/promo-codes/{promo_code_id}/disable")
async def disable_promo_code(promo_code_id: str, admin=Depends(get_current_admin)):
    result = await db.promo_codes.update_one(
        {"_id": promo_code_id},
        {"$set": {"active": False, "updated_at": _utc_now()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    row = await db.promo_codes.find_one({"_id": promo_code_id})
    promo = _doc_to_promo_code(row)
    await publish_event({"type": "promo_codes.changed", "promo_code": promo})
    return promo


@app.delete("/api/admin/promo-codes/{promo_code_id}")
async def delete_promo_code(promo_code_id: str, admin=Depends(get_current_admin)):
    result = await db.promo_codes.delete_one({"_id": promo_code_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    await publish_event({"type": "promo_codes.changed", "promo_code_id": promo_code_id, "deleted": True})
    return {"deleted": True}


@app.post("/api/promo-codes/validate")
async def validate_promo_code(req: PromoCodeApplyIn):
    promo = await _get_active_promo_code(req.code)
    discount = min(float(promo["amount"]), float(req.subtotal))
    return {
        "valid": True,
        "code": promo["code"],
        "discount_amount": discount,
        "subtotal": float(req.subtotal),
        "total": max(float(req.subtotal) - discount, 0),
        "promo_code": _doc_to_promo_code(promo),
    }


# Orders ---
@app.post("/api/orders")
async def create_order(order: OrderIn):
    _validate_uuid(order.bank_id)
    customer_address = _format_shipping_address(order)
    order_id = str(uuid.uuid4())
    now = _utc_now()
    promo = None
    promo_discount = float(order.promo_discount or 0)
    total = float(order.total)
    if order.promo_code.strip():
        promo = await _get_active_promo_code(order.promo_code)
        promo_discount = min(float(promo["amount"]), float(order.subtotal))
        total = max(float(order.subtotal) - promo_discount, 0)
    doc = {
        "_id": order_id,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "customer_phone": order.customer_phone,
        "customer_address": customer_address,
        "province": order.province,
        "town_city": order.town_city,
        "barangay": order.barangay,
        "street_house_no": order.street_house_no,
        "zipcode": order.zipcode,
        "facebook_account": order.facebook_account,
        "waybill": order.waybill,
        "shipping_mode": order.shipping_mode,
        "items": [i.model_dump() for i in order.items],
        "subtotal": order.subtotal,
        "total": total,
        "promo_code": promo["code"] if promo else "",
        "promo_discount": promo_discount if promo else 0,
        "shipment_fee": 0,
        "bank_id": order.bank_id,
        "bank_name": order.bank_name,
        "payment_proof": order.payment_proof,
        "status": "pending",
        "created_at": now,
        "confirmed_at": None,
        "shipped_at": None,
        "received_at": None,
    }
    await db.orders.insert_one(doc)
    order_data = _doc_to_order(doc)
    await publish_event({"type": "order.created", "order_id": order_data["id"], "order": order_data})
    asyncio.create_task(_notify_admin(order_data))
    asyncio.create_task(_notify_customer_order_submitted(order_data))
    return order_data


@app.get("/api/orders/{order_id}")
async def get_public_order(order_id: str):
    _validate_uuid(order_id)
    row = await db.orders.find_one({"_id": order_id})
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return _doc_to_order(row)


@app.post("/api/orders/{order_id}/receive")
async def receive_order(order_id: str):
    _validate_uuid(order_id)
    existing = await db.orders.find_one({"_id": order_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    _ensure_order_status(_doc_to_order(existing), "shipped", "mark received")
    row = await db.orders.find_one_and_update(
        {"_id": order_id},
        {"$set": {"status": "received", "received_at": _utc_now()}},
        return_document=ReturnDocument.AFTER,
    )
    order_data = _doc_to_order(row)
    await publish_event({"type": "order.updated", "order_id": order_id, "order": order_data})
    asyncio.create_task(_notify_admin_order_received(order_data))
    return order_data


@app.get("/api/admin/orders")
async def list_orders(admin=Depends(get_current_admin)):
    rows = await db.orders.find({}).sort("created_at", -1).to_list(length=None)
    return [_doc_to_order(r) for r in rows]


@app.get("/api/admin/orders/{order_id}")
async def get_order(order_id: str, admin=Depends(get_current_admin)):
    _validate_uuid(order_id)
    row = await db.orders.find_one({"_id": order_id})
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return _doc_to_order(row)


@app.post("/api/admin/orders/{order_id}/confirm")
async def confirm_order(order_id: str, admin=Depends(get_current_admin)):
    _validate_uuid(order_id)
    existing = await db.orders.find_one({"_id": order_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    if existing.get("stock_deducted"):
        order_data = _doc_to_order(existing)
        await publish_event({"type": "order.updated", "order_id": order_id, "order": order_data})
        return order_data

    deducted: dict[str, int] = {}
    for item in existing.get("items", []):
        product_id = item.get("id")
        quantity = int(item.get("quantity") or 0)
        if not product_id or quantity <= 0:
            continue
        result = await db.products.update_one(
            {"_id": product_id, "stock": {"$gte": quantity}},
            {"$inc": {"stock": -quantity}, "$set": {"updated_at": _utc_now()}},
        )
        if result.modified_count == 0:
            for rollback_id, rollback_qty in deducted.items():
                await db.products.update_one(
                    {"_id": rollback_id},
                    {"$inc": {"stock": rollback_qty}, "$set": {"updated_at": _utc_now()}},
                )
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {item.get('name') or product_id}")
        deducted[product_id] = deducted.get(product_id, 0) + quantity

    row = await db.orders.find_one_and_update(
        {"_id": order_id},
        {"$set": {"status": "confirmed", "confirmed_at": _utc_now(), "stock_deducted": True}},
        return_document=ReturnDocument.AFTER,
    )
    order_data = _doc_to_order(row)
    await publish_event({"type": "order.updated", "order_id": order_id, "order": order_data})
    for product_id in deducted:
        product_row = await db.products.find_one({"_id": product_id})
        if product_row:
            await publish_event({"type": "products.changed", "product": _doc_to_product(product_row)})
    return order_data


@app.post("/api/admin/orders/{order_id}/ship")
async def confirm_shipping(order_id: str, payload: ShippingConfirmIn, admin=Depends(get_current_admin)):
    _validate_uuid(order_id)
    existing = await db.orders.find_one({"_id": order_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    _ensure_order_status(_doc_to_order(existing), "confirmed", "confirm shipping")
    row = await db.orders.find_one_and_update(
        {"_id": order_id},
        {"$set": {"status": "shipped", "waybill": payload.waybill, "shipment_fee": payload.shipment_fee, "shipped_at": _utc_now()}},
        return_document=ReturnDocument.AFTER,
    )
    order_data = _doc_to_order(row)
    await publish_event({"type": "order.updated", "order_id": order_id, "order": order_data})
    asyncio.create_task(_notify_customer_shipped(order_data))
    return order_data


@app.post("/api/admin/orders/{order_id}/reject")
async def reject_order(order_id: str, admin=Depends(get_current_admin)):
    _validate_uuid(order_id)
    row = await db.orders.find_one_and_update(
        {"_id": order_id},
        {"$set": {"status": "rejected"}},
        return_document=ReturnDocument.AFTER,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    order_data = _doc_to_order(row)
    await publish_event({"type": "order.updated", "order_id": order_id, "order": order_data})
    return order_data


# ============== Helpers ==============
def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _validate_uuid(value: str):
    try:
        uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")


def _slugify(s: str) -> str:
    return "".join(c.lower() if c.isalnum() else "-" for c in s).strip("-")[:40]


def _format_shipping_address(order: OrderIn) -> str:
    return (
        f"{order.street_house_no}, Barangay {order.barangay}, "
        f"{order.town_city}, {order.province} {order.zipcode}"
    )


def _ensure_order_status(order: dict, expected_status: str, action: str):
    if order["status"] != expected_status:
        raise HTTPException(
            status_code=400,
            detail=f"Order must be {expected_status} before you can {action}.",
        )


def _doc_to_product(r):
    return {
        "id": r["_id"],
        "name": r["name"],
        "description": r.get("description", ""),
        "price": float(r.get("price", 0)),
        "originalPrice": float(r["original_price"]) if r.get("original_price") is not None else None,
        "image": r.get("image", ""),
        "badge": r.get("badge"),
        "category": r.get("category", "Perfumes"),
        "gender": r.get("gender", "All Genders"),
        "stock": r.get("stock", 0),
        "size": r.get("size", ""),
    }


def _product_page_response(items: list[dict], total: int, limit: int, offset: int):
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "hasMore": offset + len(items) < total,
    }


def _doc_to_bank(r):
    return {
        "id": str(r["_id"]),
        "name": r["name"],
        "account_name": r.get("account_name", ""),
        "account_number": r.get("account_number", ""),
        "qr_image": r.get("qr_image", ""),
    }


def _iso(value):
    return value.isoformat() if value else None


def _normalize_promo_code(code: str) -> str:
    return code.strip().upper()


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _validate_promo_code_range(starts_at: datetime, ends_at: datetime):
    if _ensure_utc(ends_at) < _ensure_utc(starts_at):
        raise HTTPException(status_code=400, detail="Promo code end date must be after start date")


def _promo_status(doc: dict, now: Optional[datetime] = None) -> str:
    current = now or _utc_now()
    if not doc.get("active", True):
        return "disabled"
    starts_at = doc.get("starts_at")
    ends_at = doc.get("ends_at")
    if starts_at and current < starts_at:
        return "scheduled"
    if ends_at and current > ends_at:
        return "expired"
    return "active"


def _doc_to_promo_code(r):
    return {
        "id": str(r["_id"]),
        "code": r["code"],
        "amount": float(r.get("amount", 0)),
        "starts_at": _iso(r.get("starts_at")),
        "ends_at": _iso(r.get("ends_at")),
        "active": bool(r.get("active", True)),
        "status": _promo_status(r),
        "created_at": _iso(r.get("created_at")),
        "updated_at": _iso(r.get("updated_at")),
    }


async def _get_active_promo_code(code: str) -> dict:
    promo = await db.promo_codes.find_one({"code_normalized": _normalize_promo_code(code)})
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    if _promo_status(promo) != "active":
        raise HTTPException(status_code=400, detail="Promo code is not available")
    return promo


def _doc_to_order(r):
    return {
        "id": str(r["_id"]),
        "customer_name": r["customer_name"],
        "customer_email": r["customer_email"],
        "customer_phone": r.get("customer_phone", ""),
        "customer_address": r.get("customer_address", ""),
        "province": r.get("province", ""),
        "town_city": r.get("town_city", ""),
        "barangay": r.get("barangay", ""),
        "street_house_no": r.get("street_house_no", ""),
        "zipcode": r.get("zipcode", ""),
        "facebook_account": r.get("facebook_account", ""),
        "waybill": r.get("waybill", ""),
        "shipping_mode": r.get("shipping_mode", ""),
        "shipment_fee": float(r.get("shipment_fee", 0)),
        "items": r.get("items", []),
        "subtotal": float(r.get("subtotal", 0)),
        "total": float(r.get("total", 0)),
        "promo_code": r.get("promo_code", ""),
        "promo_discount": float(r.get("promo_discount", 0)),
        "bank_id": str(r["bank_id"]) if r.get("bank_id") else None,
        "bank_name": r.get("bank_name", ""),
        "payment_proof": r.get("payment_proof", ""),
        "status": r.get("status", "pending"),
        "created_at": _iso(r.get("created_at")),
        "confirmed_at": _iso(r.get("confirmed_at")),
        "shipped_at": _iso(r.get("shipped_at")),
        "received_at": _iso(r.get("received_at")),
    }


def _format_currency(value: float) -> str:
    return f"₱{value:.2f}"


def _items_rows_html(order: dict) -> str:
    return "".join(
        f"<tr><td style='padding:6px 12px;border-bottom:1px solid #eee'>{i['name']} x {i['quantity']}</td>"
        f"<td style='padding:6px 12px;text-align:right;border-bottom:1px solid #eee'>{_format_currency(i['price'] * i['quantity'])}</td></tr>"
        for i in order["items"]
    )


def _order_details_html(order: dict) -> str:
    promo_html = ""
    if order.get("promo_code") and float(order.get("promo_discount", 0)) > 0:
        promo_html = (
            f"<p style=\"margin:0 0 4px\"><strong>Promo Code:</strong> {order['promo_code']} "
            f"(-{_format_currency(float(order['promo_discount']))})</p>"
        )
    return f"""
      <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px">
        <p style="margin:0 0 4px"><strong>Order ID:</strong> {order['id']}</p>
        <p style="margin:0 0 4px"><strong>Customer:</strong> {order['customer_name']}</p>
        <p style="margin:0 0 4px"><strong>Email:</strong> {order['customer_email']}</p>
        <p style="margin:0 0 4px"><strong>Phone:</strong> {order['customer_phone'] or '-'}</p>
        <p style="margin:0 0 4px"><strong>Facebook:</strong> {order['facebook_account']}</p>
        <p style="margin:0 0 4px"><strong>Address:</strong> {order['customer_address']}</p>
        <p style="margin:0 0 4px"><strong>Shipping Mode:</strong> {order['shipping_mode']}</p>
        {promo_html}
        <p style="margin:0 0 4px"><strong>Waybill:</strong> {order['waybill'] or 'Not available yet'}</p>
        <p style="margin:0"><strong>Total:</strong> {_format_currency(order['total'])}</p>
      </div>
    """


async def _notify_admin(order: dict):
    try:
        link = f"{APP_URL}/admin/orders/{order['id']}"
        items_html = _items_rows_html(order)
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#faf7f2;">
          <h2 style="color:#1c1c1c;margin:0 0 8px">New Payment Submission</h2>
          <p style="color:#555;margin:0 0 16px">Order ID: <code>{order['id']}</code></p>
          {_order_details_html(order)}
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;margin-bottom:20px">
            {items_html}
          </table>
          <a href="{link}" style="display:inline-block;background:#1c1c1c;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:500">
            Review &amp; Confirm Payment
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">Essencia Admin Notification</p>
        </div>
        """
        params = {"from": SENDER_EMAIL, "to": [ADMIN_EMAIL], "subject": f"New payment from {order['customer_name']} - {_format_currency(order['total'])}", "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Notification email sent: %s", result)
    except Exception as e:
        logger.exception("Failed to send admin notification: %s", e)


async def _notify_customer_order_submitted(order: dict):
    try:
        link = f"{APP_URL}/status"
        items_html = _items_rows_html(order)
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#faf7f2;">
          <h2 style="color:#1c1c1c;margin:0 0 8px">We received your order</h2>
          <p style="color:#555;margin:0 0 16px">Use this Order ID to check your order status: <code>{order['id']}</code></p>
          {_order_details_html(order)}
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;margin-bottom:20px">
            {items_html}
          </table>
          <a href="{link}" style="display:inline-block;background:#1c1c1c;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:500">
            Check Order Status
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">Essencia Order Confirmation</p>
        </div>
        """
        params = {"from": SENDER_EMAIL, "to": [order["customer_email"]], "subject": f"Your Essencia order {order['id']}", "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Customer order email sent: %s", result)
    except Exception as e:
        logger.exception("Failed to send customer order email: %s", e)


async def _notify_customer_shipped(order: dict):
    try:
        link = f"{APP_URL}/status"
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#faf7f2;">
          <h2 style="color:#1c1c1c;margin:0 0 8px">Your order has shipped</h2>
          <p style="color:#555;margin:0 0 16px">Order ID: <code>{order['id']}</code></p>
          {_order_details_html(order)}
          <a href="{link}" style="display:inline-block;background:#1c1c1c;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:500">
            View Shipment Status
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">Please mark the order received once it arrives.</p>
        </div>
        """
        params = {"from": SENDER_EMAIL, "to": [order["customer_email"]], "subject": "Your Essencia order has shipped", "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Customer shipping email sent: %s", result)
    except Exception as e:
        logger.exception("Failed to send customer shipping email: %s", e)


async def _notify_admin_order_received(order: dict):
    try:
        link = f"{APP_URL}/admin/orders/{order['id']}"
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#faf7f2;">
          <h2 style="color:#1c1c1c;margin:0 0 8px">Order Received by Customer</h2>
          <p style="color:#555;margin:0 0 16px">Order ID: <code>{order['id']}</code></p>
          {_order_details_html(order)}
          <a href="{link}" style="display:inline-block;background:#1c1c1c;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:500">
            View Order
          </a>
        </div>
        """
        params = {"from": SENDER_EMAIL, "to": [ADMIN_EMAIL], "subject": f"Order received: {order['id']}", "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Admin received email sent: %s", result)
    except Exception as e:
        logger.exception("Failed to send admin received email: %s", e)
