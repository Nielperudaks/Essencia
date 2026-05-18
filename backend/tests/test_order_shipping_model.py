"""Order payload validation tests for shipping checkout fields."""
import importlib
import os
from copy import deepcopy

import pytest
from pydantic import ValidationError


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


def test_order_payload_accepts_required_shipping_fields():
    server = _server_module()

    order = server.OrderIn(**_valid_order_payload())

    assert order.province == "Cavite"
    assert order.town_city == "Dasmarinas"
    assert order.barangay == "Burol"
    assert order.street_house_no == "123 Sample Street"
    assert order.zipcode == "4114"
    assert order.facebook_account == "facebook.com/test.customer"
    assert order.waybill == ""
    assert order.shipping_mode == "LBC"


@pytest.mark.parametrize(
    "field",
    [
        "province",
        "town_city",
        "barangay",
        "street_house_no",
        "zipcode",
        "facebook_account",
        "shipping_mode",
    ],
)
def test_order_payload_requires_shipping_fields(field):
    server = _server_module()
    payload = deepcopy(_valid_order_payload())
    payload.pop(field)

    with pytest.raises(ValidationError) as exc:
        server.OrderIn(**payload)

    assert field in str(exc.value)
