import os
import asyncio
import logging
import uuid
import json
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional, List
from contextlib import asynccontextmanager

import asyncpg
import bcrypt
import jwt
import resend
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ["DATABASE_URL"]
RESEND_API_KEY = os.environ["RESEND_API_KEY"]
SENDER_EMAIL = os.environ["SENDER_EMAIL"]
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Admin")
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
APP_URL = os.environ.get("APP_URL", "http://localhost:3000")

resend.api_key = RESEND_API_KEY

db_pool: Optional[asyncpg.Pool] = None


# ============== DB Schema & Seed ==============
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    original_price NUMERIC(10,2),
    image TEXT NOT NULL DEFAULT '',
    badge TEXT,
    category TEXT NOT NULL DEFAULT 'Perfumes',
    stock INTEGER NOT NULL DEFAULT 0,
    size TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    account_name TEXT NOT NULL DEFAULT '',
    account_number TEXT NOT NULL DEFAULT '',
    qr_image TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL DEFAULT '',
    customer_address TEXT NOT NULL DEFAULT '',
    province TEXT NOT NULL DEFAULT '',
    town_city TEXT NOT NULL DEFAULT '',
    barangay TEXT NOT NULL DEFAULT '',
    street_house_no TEXT NOT NULL DEFAULT '',
    zipcode TEXT NOT NULL DEFAULT '',
    facebook_account TEXT NOT NULL DEFAULT '',
    waybill TEXT NOT NULL DEFAULT '',
    shipping_mode TEXT NOT NULL DEFAULT '',
    items JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    bank_id UUID,
    bank_name TEXT NOT NULL DEFAULT '',
    payment_proof TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS province TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS town_city TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS barangay TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS street_house_no TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zipcode TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS facebook_account TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS waybill TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_mode TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;
"""

SEED_PRODUCTS = [
    {
        "id": "acqua-di-gio",
        "name": "Acqua di Gio Eau de Parfum",
        "description": "Bright citrus and marine freshness with soft woods and musk.",
        "price": 399, "image": "https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/perfumes/acqua_di_gio.png",
        "badge": "Bestseller", "category": "Perfumes", "stock": 25, "size": "100ml"
    },
    {
        "id": "versace-eros",
        "name": "Versace Eros Eau de Parfum",
        "description": "Minty apple sweetness with creamy vanilla and warm woods.",
        "price": 399, "image": "https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/perfumes/versace_eros.png",
        "badge": "Bestseller", "category": "Perfumes", "stock": 18, "size": "100ml"
    },
    {
        "id": "creed-aventus",
        "name": "Creed Aventus Eau de Parfum",
        "description": "Juicy pineapple and smoky birch with rich musk and oakmoss.",
        "price": 399, "image": "https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/perfumes/aventus.png",
        "badge": "Bestseller", "category": "Perfumes", "stock": 12, "size": "100ml"
    },
    {
        "id": "pacco-rabanne-one-mil",
        "name": "Paco Rabanne 1 Million Eau de Parfum",
        "description": "Sweet citrus and cinnamon spice with a warm leather base.",
        "price": 399, "image": "https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/perfumes/pacco_rabanne_one_mil.png",
        "badge": "Bestseller", "category": "Perfumes", "stock": 20, "size": "100ml"
    },
]


async def init_db():
    async with db_pool.acquire() as conn:
        await conn.execute(SCHEMA_SQL)
        # Seed admin
        existing = await conn.fetchrow("SELECT id FROM admins WHERE email=$1", ADMIN_EMAIL)
        if not existing:
            pw_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
            await conn.execute(
                "INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3)",
                ADMIN_EMAIL, pw_hash, ADMIN_NAME
            )
            logger.info(f"Seeded admin: {ADMIN_EMAIL}")
        # Seed products
        for p in SEED_PRODUCTS:
            await conn.execute(
                """INSERT INTO products (id, name, description, price, image, badge, category, stock, size)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                   ON CONFLICT (id) DO NOTHING""",
                p["id"], p["name"], p["description"], p["price"], p["image"],
                p["badge"], p["category"], p["stock"], p["size"]
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5, ssl="require")
    await init_db()
    logger.info("Database initialized")
    yield
    await db_pool.close()


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
    stock: int = 0
    size: str = ""


class BankIn(BaseModel):
    name: str
    account_name: str = ""
    account_number: str = ""
    qr_image: str = ""


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
    bank_id: str
    bank_name: str
    payment_proof: str  # base64 image


class ShippingConfirmIn(BaseModel):
    waybill: str = Field(..., min_length=1)


# ============== Auth Helpers ==============
def create_token(admin_id: str, email: str) -> str:
    payload = {
        "sub": admin_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id, email, name FROM admins WHERE id=$1", uuid.UUID(payload["sub"]))
    if not row:
        raise HTTPException(status_code=401, detail="Admin not found")
    return dict(row)


# ============== Routes ==============
@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/admin/login", response_model=TokenResponse)
async def admin_login(req: LoginRequest):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, password_hash, name FROM admins WHERE email=$1", req.email
        )
    if not row or not bcrypt.checkpw(req.password.encode(), row["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(str(row["id"]), row["email"])
    return {
        "access_token": token,
        "admin": {"id": str(row["id"]), "email": row["email"], "name": row["name"]},
    }


@app.get("/api/admin/me")
async def get_me(admin=Depends(get_current_admin)):
    return {"id": str(admin["id"]), "email": admin["email"], "name": admin["name"]}


# Products ---
@app.get("/api/products")
async def list_products(category: Optional[str] = None):
    async with db_pool.acquire() as conn:
        if category and category.lower() != "all":
            rows = await conn.fetch(
                "SELECT * FROM products WHERE category=$1 ORDER BY created_at DESC", category
            )
        else:
            rows = await conn.fetch("SELECT * FROM products ORDER BY created_at DESC")
    return [_row_to_product(r) for r in rows]


@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM products WHERE id=$1", product_id)
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return _row_to_product(row)


@app.post("/api/admin/products")
async def create_product(p: ProductIn, admin=Depends(get_current_admin)):
    pid = p.id or _slugify(p.name) + "-" + uuid.uuid4().hex[:6]
    async with db_pool.acquire() as conn:
        try:
            await conn.execute(
                """INSERT INTO products (id, name, description, price, original_price, image, badge, category, stock, size)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)""",
                pid, p.name, p.description, p.price, p.original_price, p.image,
                p.badge, p.category, p.stock, p.size,
            )
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=400, detail="Product id already exists")
        row = await conn.fetchrow("SELECT * FROM products WHERE id=$1", pid)
    return _row_to_product(row)


@app.put("/api/admin/products/{product_id}")
async def update_product(product_id: str, p: ProductIn, admin=Depends(get_current_admin)):
    async with db_pool.acquire() as conn:
        result = await conn.execute(
            """UPDATE products SET name=$1, description=$2, price=$3, original_price=$4,
                  image=$5, badge=$6, category=$7, stock=$8, size=$9, updated_at=NOW()
               WHERE id=$10""",
            p.name, p.description, p.price, p.original_price, p.image,
            p.badge, p.category, p.stock, p.size, product_id,
        )
        if result.endswith("0"):
            raise HTTPException(status_code=404, detail="Product not found")
        row = await conn.fetchrow("SELECT * FROM products WHERE id=$1", product_id)
    return _row_to_product(row)


@app.delete("/api/admin/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_current_admin)):
    async with db_pool.acquire() as conn:
        result = await conn.execute("DELETE FROM products WHERE id=$1", product_id)
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Product not found")
    return {"deleted": True}


# Banks ---
@app.get("/api/banks")
async def list_banks():
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM banks ORDER BY created_at ASC")
    return [_row_to_bank(r) for r in rows]


@app.post("/api/admin/banks")
async def create_bank(b: BankIn, admin=Depends(get_current_admin)):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO banks (name, account_name, account_number, qr_image)
               VALUES ($1,$2,$3,$4) RETURNING *""",
            b.name, b.account_name, b.account_number, b.qr_image,
        )
    return _row_to_bank(row)


@app.put("/api/admin/banks/{bank_id}")
async def update_bank(bank_id: str, b: BankIn, admin=Depends(get_current_admin)):
    async with db_pool.acquire() as conn:
        result = await conn.execute(
            """UPDATE banks SET name=$1, account_name=$2, account_number=$3, qr_image=$4
               WHERE id=$5""",
            b.name, b.account_name, b.account_number, b.qr_image, uuid.UUID(bank_id),
        )
        if result.endswith("0"):
            raise HTTPException(status_code=404, detail="Bank not found")
        row = await conn.fetchrow("SELECT * FROM banks WHERE id=$1", uuid.UUID(bank_id))
    return _row_to_bank(row)


@app.delete("/api/admin/banks/{bank_id}")
async def delete_bank(bank_id: str, admin=Depends(get_current_admin)):
    async with db_pool.acquire() as conn:
        result = await conn.execute("DELETE FROM banks WHERE id=$1", uuid.UUID(bank_id))
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Bank not found")
    return {"deleted": True}


# Orders ---
@app.post("/api/orders")
async def create_order(order: OrderIn):
    customer_address = _format_shipping_address(order)
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO orders
                 (customer_name, customer_email, customer_phone, customer_address,
                  province, town_city, barangay, street_house_no, zipcode,
                  facebook_account, waybill, shipping_mode,
                  items, subtotal, total, bank_id, bank_name, payment_proof, status)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'pending')
               RETURNING *""",
            order.customer_name, order.customer_email, order.customer_phone, customer_address,
            order.province, order.town_city, order.barangay, order.street_house_no, order.zipcode,
            order.facebook_account, order.waybill, order.shipping_mode,
            json.dumps([i.model_dump() for i in order.items]),
            order.subtotal, order.total,
            uuid.UUID(order.bank_id), order.bank_name,
            order.payment_proof,
        )
    order_data = _row_to_order(row)
    # Fire off email (non-blocking)
    asyncio.create_task(_notify_admin(order_data))
    asyncio.create_task(_notify_customer_order_submitted(order_data))
    return order_data


@app.get("/api/orders/{order_id}")
async def get_public_order(order_id: str):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM orders WHERE id=$1", uuid.UUID(order_id))
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return _row_to_order(row)


@app.post("/api/orders/{order_id}/receive")
async def receive_order(order_id: str):
    async with db_pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT * FROM orders WHERE id=$1", uuid.UUID(order_id))
        if not existing:
            raise HTTPException(status_code=404, detail="Order not found")
        _ensure_order_status(_row_to_order(existing), "shipped", "mark received")
        row = await conn.fetchrow(
            """UPDATE orders SET status='received', received_at=NOW()
               WHERE id=$1 RETURNING *""",
            uuid.UUID(order_id),
        )
    order_data = _row_to_order(row)
    asyncio.create_task(_notify_admin_order_received(order_data))
    return order_data


@app.get("/api/admin/orders")
async def list_orders(admin=Depends(get_current_admin)):
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM orders ORDER BY created_at DESC")
    return [_row_to_order(r) for r in rows]


@app.get("/api/admin/orders/{order_id}")
async def get_order(order_id: str, admin=Depends(get_current_admin)):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM orders WHERE id=$1", uuid.UUID(order_id))
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return _row_to_order(row)


@app.post("/api/admin/orders/{order_id}/confirm")
async def confirm_order(order_id: str, admin=Depends(get_current_admin)):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """UPDATE orders SET status='confirmed', confirmed_at=NOW()
               WHERE id=$1 RETURNING *""",
            uuid.UUID(order_id),
        )
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return _row_to_order(row)


@app.post("/api/admin/orders/{order_id}/ship")
async def confirm_shipping(order_id: str, payload: ShippingConfirmIn, admin=Depends(get_current_admin)):
    async with db_pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT * FROM orders WHERE id=$1", uuid.UUID(order_id))
        if not existing:
            raise HTTPException(status_code=404, detail="Order not found")
        _ensure_order_status(_row_to_order(existing), "confirmed", "confirm shipping")
        row = await conn.fetchrow(
            """UPDATE orders SET status='shipped', waybill=$1, shipped_at=NOW()
               WHERE id=$2 RETURNING *""",
            payload.waybill, uuid.UUID(order_id),
        )
    order_data = _row_to_order(row)
    asyncio.create_task(_notify_customer_shipped(order_data))
    return order_data


@app.post("/api/admin/orders/{order_id}/reject")
async def reject_order(order_id: str, admin=Depends(get_current_admin)):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE orders SET status='rejected' WHERE id=$1 RETURNING *",
            uuid.UUID(order_id),
        )
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return _row_to_order(row)


# ============== Helpers ==============
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


def _row_to_product(r):
    return {
        "id": r["id"],
        "name": r["name"],
        "description": r["description"],
        "price": float(r["price"]),
        "originalPrice": float(r["original_price"]) if r["original_price"] is not None else None,
        "image": r["image"],
        "badge": r["badge"],
        "category": r["category"],
        "stock": r["stock"],
        "size": r["size"],
    }


def _row_to_bank(r):
    return {
        "id": str(r["id"]),
        "name": r["name"],
        "account_name": r["account_name"],
        "account_number": r["account_number"],
        "qr_image": r["qr_image"],
    }


def _row_to_order(r):
    items = r["items"]
    if isinstance(items, str):
        items = json.loads(items)
    return {
        "id": str(r["id"]),
        "customer_name": r["customer_name"],
        "customer_email": r["customer_email"],
        "customer_phone": r["customer_phone"],
        "customer_address": r["customer_address"],
        "province": r["province"],
        "town_city": r["town_city"],
        "barangay": r["barangay"],
        "street_house_no": r["street_house_no"],
        "zipcode": r["zipcode"],
        "facebook_account": r["facebook_account"],
        "waybill": r["waybill"],
        "shipping_mode": r["shipping_mode"],
        "items": items,
        "subtotal": float(r["subtotal"]),
        "total": float(r["total"]),
        "bank_id": str(r["bank_id"]) if r["bank_id"] else None,
        "bank_name": r["bank_name"],
        "payment_proof": r["payment_proof"],
        "status": r["status"],
        "created_at": r["created_at"].isoformat() if r["created_at"] else None,
        "confirmed_at": r["confirmed_at"].isoformat() if r["confirmed_at"] else None,
        "shipped_at": r["shipped_at"].isoformat() if r["shipped_at"] else None,
        "received_at": r["received_at"].isoformat() if r["received_at"] else None,
    }


def _items_rows_html(order: dict) -> str:
    return "".join(
        f"<tr><td style='padding:6px 12px;border-bottom:1px solid #eee'>{i['name']} × {i['quantity']}</td>"
        f"<td style='padding:6px 12px;text-align:right;border-bottom:1px solid #eee'>${i['price'] * i['quantity']:.2f}</td></tr>"
        for i in order["items"]
    )


def _order_details_html(order: dict) -> str:
    return f"""
      <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px">
        <p style="margin:0 0 4px"><strong>Order ID:</strong> {order['id']}</p>
        <p style="margin:0 0 4px"><strong>Customer:</strong> {order['customer_name']}</p>
        <p style="margin:0 0 4px"><strong>Email:</strong> {order['customer_email']}</p>
        <p style="margin:0 0 4px"><strong>Phone:</strong> {order['customer_phone'] or '—'}</p>
        <p style="margin:0 0 4px"><strong>Facebook:</strong> {order['facebook_account']}</p>
        <p style="margin:0 0 4px"><strong>Address:</strong> {order['customer_address']}</p>
        <p style="margin:0 0 4px"><strong>Shipping Mode:</strong> {order['shipping_mode']}</p>
        <p style="margin:0 0 4px"><strong>Waybill:</strong> {order['waybill'] or 'Not available yet'}</p>
        <p style="margin:0"><strong>Total:</strong> ${order['total']:.2f}</p>
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
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "subject": f"New payment from {order['customer_name']} — ${order['total']:.2f}",
            "html": html,
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Notification email sent: {result}")
    except Exception as e:
        logger.exception(f"Failed to send admin notification: {e}")


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
        params = {
            "from": SENDER_EMAIL,
            "to": [order["customer_email"]],
            "subject": f"Your Essencia order {order['id']}",
            "html": html,
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Customer order email sent: {result}")
    except Exception as e:
        logger.exception(f"Failed to send customer order email: {e}")


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
        params = {
            "from": SENDER_EMAIL,
            "to": [order["customer_email"]],
            "subject": "Your Essencia order has shipped",
            "html": html,
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Customer shipping email sent: {result}")
    except Exception as e:
        logger.exception(f"Failed to send customer shipping email: {e}")


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
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "subject": f"Order received: {order['id']}",
            "html": html,
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Admin received email sent: {result}")
    except Exception as e:
        logger.exception(f"Failed to send admin received email: {e}")
