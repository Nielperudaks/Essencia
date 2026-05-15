"""Order lifecycle helper tests."""
import importlib
import os

import pytest
from fastapi import HTTPException
from pydantic import ValidationError


def _server_module():
    os.environ.setdefault("DATABASE_URL", "postgresql://example")
    os.environ.setdefault("RESEND_API_KEY", "test")
    os.environ.setdefault("SENDER_EMAIL", "sender@example.com")
    os.environ.setdefault("ADMIN_EMAIL", "admin@example.com")
    os.environ.setdefault("ADMIN_PASSWORD", "password")
    os.environ.setdefault("JWT_SECRET", "secret")
    return importlib.import_module("server")


def _valid_order_payload():
    return {
        "customer_name": "Test Customer",
        "customer_email": "test@example.com",
        "customer_phone": "+639171234567",
        "province": "Cavite",
        "town_city": "Dasmarinas",
        "barangay": "Burol",
        "street_house_no": "123 Sample Street",
        "zipcode": "4114",
        "facebook_account": "facebook.com/test.customer",
        "shipping_mode": "LBC",
        "items": [
            {
                "id": "acqua-di-gio",
                "name": "Acqua di Gio",
                "description": "",
                "price": 399,
                "quantity": 1,
                "image": "",
                "size": "100ml",
            }
        ],
        "subtotal": 399,
        "total": 399,
        "bank_id": "00000000-0000-0000-0000-000000000001",
        "bank_name": "Test Bank",
        "payment_proof": "data:image/png;base64,abc",
    }


def test_customer_checkout_does_not_require_waybill():
    server = _server_module()

    order = server.OrderIn(**_valid_order_payload())

    assert order.waybill == ""


def test_confirm_shipping_requires_waybill():
    server = _server_module()

    with pytest.raises(ValidationError) as exc:
        server.ShippingConfirmIn(waybill="")

    assert "waybill" in str(exc.value)


def test_shipping_can_only_be_confirmed_after_payment_confirmation():
    server = _server_module()

    with pytest.raises(HTTPException) as exc:
        server._ensure_order_status({"status": "pending"}, "confirmed", "confirm shipping")

    assert exc.value.status_code == 400
    assert "confirmed" in exc.value.detail


def test_order_can_only_be_received_after_shipping():
    server = _server_module()

    with pytest.raises(HTTPException) as exc:
        server._ensure_order_status({"status": "confirmed"}, "shipped", "mark received")

    assert exc.value.status_code == 400
    assert "shipped" in exc.value.detail
