"""Mongo document and realtime routing contract tests."""
import asyncio
import importlib
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def _server_module():
    os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017")
    os.environ.setdefault("MONGODB_DB", "essencia_test")
    os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
    os.environ.setdefault("RESEND_API_KEY", "test")
    os.environ.setdefault("SENDER_EMAIL", "sender@example.com")
    os.environ.setdefault("ADMIN_EMAIL", "admin@example.com")
    os.environ.setdefault("ADMIN_PASSWORD", "password")
    os.environ.setdefault("JWT_SECRET", "secret")
    return importlib.import_module("server")


class FakeSocket:
    def __init__(self):
        self.accepted = False
        self.messages = []

    async def accept(self):
        self.accepted = True

    async def send_json(self, message):
        self.messages.append(message)


def test_mongo_defaults_are_local_first():
    server = _server_module()

    assert server.MONGODB_URI == "mongodb://localhost:27017"
    assert server.MONGODB_DB in ("essencia", "essencia_test")
    assert server.REDIS_URL == "redis://localhost:6379/0"


def test_seed_data_includes_products_and_starter_bank():
    server = _server_module()

    assert any(product["id"] == "acqua-di-gio" for product in server.SEED_PRODUCTS)
    assert any(bank["name"] == "GCash" for bank in server.SEED_BANKS)


def test_document_helpers_preserve_existing_api_shapes():
    server = _server_module()
    now = datetime(2026, 5, 18, tzinfo=timezone.utc)

    product = server._doc_to_product(
        {
            "_id": "sample-product",
            "name": "Sample",
            "description": "Desc",
            "price": 199.5,
            "original_price": 249.5,
            "image": "image",
            "badge": "New",
            "category": "Perfumes",
            "stock": 3,
            "size": "50ml",
        }
    )
    order = server._doc_to_order(
        {
            "_id": "00000000-0000-0000-0000-000000000123",
            "customer_name": "Customer",
            "customer_email": "customer@example.com",
            "customer_phone": "0917",
            "customer_address": "Street",
            "province": "Cavite",
            "town_city": "Dasmarinas",
            "barangay": "Burol",
            "street_house_no": "123",
            "zipcode": "4114",
            "facebook_account": "facebook.com/customer",
            "waybill": "",
            "shipping_mode": "LBC",
            "items": [{"id": "sample-product", "name": "Sample", "price": 199.5, "quantity": 1, "image": ""}],
            "subtotal": 199.5,
            "total": 199.5,
            "bank_id": "00000000-0000-0000-0000-000000000001",
            "bank_name": "GCash",
            "payment_proof": "data:image/png;base64,abc",
            "status": "pending",
            "created_at": now,
            "confirmed_at": None,
            "shipped_at": None,
            "received_at": None,
        }
    )

    assert product["id"] == "sample-product"
    assert product["originalPrice"] == 249.5
    assert order["id"] == "00000000-0000-0000-0000-000000000123"
    assert order["items"][0]["id"] == "sample-product"
    assert order["created_at"] == "2026-05-18T00:00:00+00:00"


def test_product_page_response_reports_has_more_and_total():
    server = _server_module()
    products = [{"id": f"product-{i}"} for i in range(9)]

    page = server._product_page_response(products, total=12, limit=9, offset=0)

    assert page["items"] == products
    assert page["total"] == 12
    assert page["limit"] == 9
    assert page["offset"] == 0
    assert page["hasMore"] is True


def test_product_page_response_reports_last_page():
    server = _server_module()
    products = [{"id": "product-10"}, {"id": "product-11"}]

    page = server._product_page_response(products, total=11, limit=9, offset=9)

    assert page["items"] == products
    assert page["hasMore"] is False


def test_realtime_manager_routes_events_to_admins_and_matching_order_clients():
    server = _server_module()

    async def scenario():
        manager = server.RealtimeManager()
        admin_socket = FakeSocket()
        matching_order_socket = FakeSocket()
        other_order_socket = FakeSocket()

        await manager.connect_admin(admin_socket)
        await manager.connect_order("order-1", matching_order_socket)
        await manager.connect_order("order-2", other_order_socket)

        await manager.broadcast(
            {
                "type": "order.updated",
                "order_id": "order-1",
                "order": {"id": "order-1", "status": "confirmed"},
            }
        )

        assert admin_socket.messages[-1]["type"] == "order.updated"
        assert matching_order_socket.messages[-1]["order"]["status"] == "confirmed"
        assert other_order_socket.messages == []

    asyncio.run(scenario())
