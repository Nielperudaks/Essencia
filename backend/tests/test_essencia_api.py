"""Essencia Perfume backend API tests."""
import os
import uuid
from datetime import datetime, timedelta, timezone
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://0eef988a-4370-4b92-af23-93295b204d8c.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "renielperuda2@gmail.com"
ADMIN_PASSWORD = "password123"

# 1x1 PNG base64
PNG_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    assert data["admin"]["email"] == ADMIN_EMAIL
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ============== Health ==============
class TestHealth:
    def test_health(self, session):
        r = session.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


# ============== Auth ==============
class TestAuth:
    def test_login_success(self, session):
        r = session.post(f"{BASE_URL}/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body and len(body["access_token"]) > 10
        assert body["admin"]["email"] == ADMIN_EMAIL
        assert "id" in body["admin"]

    def test_login_wrong_password(self, session):
        r = session.post(f"{BASE_URL}/api/admin/login", json={"email": ADMIN_EMAIL, "password": "wrong-password"})
        assert r.status_code == 401

    def test_login_unknown_email(self, session):
        r = session.post(f"{BASE_URL}/api/admin/login", json={"email": "nobody@nope.com", "password": "x"})
        assert r.status_code == 401

    def test_me_with_token(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/admin/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_without_token(self, session):
        r = requests.get(f"{BASE_URL}/api/admin/me")
        assert r.status_code in (401, 403)

    def test_me_invalid_token(self, session):
        r = requests.get(f"{BASE_URL}/api/admin/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code in (401, 403)


# ============== Products (Public) ==============
class TestProductsPublic:
    def test_list_products(self, session):
        r = session.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 4
        # Validate seeded perfume present
        ids = [p["id"] for p in data]
        assert "acqua-di-gio" in ids

    def test_list_products_category_perfumes(self, session):
        r = session.get(f"{BASE_URL}/api/products", params={"category": "Perfumes"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 4
        assert all(p["category"] == "Perfumes" for p in data)

    def test_get_single_product(self, session):
        r = session.get(f"{BASE_URL}/api/products/acqua-di-gio")
        assert r.status_code == 200
        p = r.json()
        assert p["id"] == "acqua-di-gio"
        assert p["price"] == 399.0
        assert p["stock"] >= 0

    def test_get_unknown_product_404(self, session):
        r = session.get(f"{BASE_URL}/api/products/does-not-exist-xyz")
        assert r.status_code == 404


# ============== Products (Admin CRUD) ==============
class TestProductsAdmin:
    created_id = None

    def test_create_requires_auth(self, session):
        r = session.post(f"{BASE_URL}/api/admin/products", json={"name": "TEST_NoAuth", "price": 1})
        assert r.status_code in (401, 403)

    def test_create_product(self, session, auth_headers):
        payload = {
            "name": "TEST_Perfume_Tester",
            "description": "test product",
            "price": 199.99,
            "category": "Perfumes",
            "stock": 5,
            "size": "50ml",
            "image": "",
        }
        r = session.post(f"{BASE_URL}/api/admin/products", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["name"] == payload["name"]
        assert body["price"] == 199.99
        assert body["stock"] == 5
        assert body["id"]
        TestProductsAdmin.created_id = body["id"]

        # Verify in list
        listr = session.get(f"{BASE_URL}/api/products")
        ids = [p["id"] for p in listr.json()]
        assert body["id"] in ids

    def test_update_product(self, session, auth_headers):
        pid = TestProductsAdmin.created_id
        assert pid
        payload = {
            "name": "TEST_Perfume_Updated",
            "description": "updated",
            "price": 249.50,
            "category": "Perfumes",
            "stock": 10,
            "size": "100ml",
            "image": "",
        }
        r = session.put(f"{BASE_URL}/api/admin/products/{pid}", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["name"] == "TEST_Perfume_Updated"
        assert body["price"] == 249.50
        assert body["stock"] == 10

        # GET to verify persistence
        g = session.get(f"{BASE_URL}/api/products/{pid}")
        assert g.status_code == 200
        assert g.json()["price"] == 249.50

    def test_delete_product(self, session, auth_headers):
        pid = TestProductsAdmin.created_id
        assert pid
        r = session.delete(f"{BASE_URL}/api/admin/products/{pid}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json().get("deleted") is True

        # Verify gone
        g = session.get(f"{BASE_URL}/api/products/{pid}")
        assert g.status_code == 404


# ============== Banks ==============
class TestBanks:
    created_id = None

    def test_list_banks_public(self, session):
        r = session.get(f"{BASE_URL}/api/banks")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_bank_requires_auth(self, session):
        r = session.post(f"{BASE_URL}/api/admin/banks", json={"name": "TEST_NoAuth"})
        assert r.status_code in (401, 403)

    def test_create_bank(self, session, auth_headers):
        payload = {
            "name": "TEST_BPI",
            "account_name": "TEST Account",
            "account_number": "1234567890",
            "qr_image": PNG_B64,
        }
        r = session.post(f"{BASE_URL}/api/admin/banks", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["name"] == "TEST_BPI"
        assert body["account_number"] == "1234567890"
        assert body["qr_image"].startswith("data:image/png;base64,")
        assert body["id"]
        TestBanks.created_id = body["id"]

        # verify in list
        lr = session.get(f"{BASE_URL}/api/banks")
        assert any(b["id"] == body["id"] for b in lr.json())

    def test_update_bank(self, session, auth_headers):
        bid = TestBanks.created_id
        assert bid
        payload = {
            "name": "TEST_BPI_Updated",
            "account_name": "TEST Updated",
            "account_number": "9999999",
            "qr_image": PNG_B64,
        }
        r = session.put(f"{BASE_URL}/api/admin/banks/{bid}", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        assert r.json()["name"] == "TEST_BPI_Updated"
        assert r.json()["account_number"] == "9999999"


# ============== Orders ==============
class TestOrders:
    bank_id = None
    order_id_confirm = None
    order_id_reject = None

    def _ensure_bank(self, session, auth_headers):
        if TestOrders.bank_id:
            return TestOrders.bank_id
        r = session.post(
            f"{BASE_URL}/api/admin/banks",
            json={"name": "TEST_OrderBank", "account_name": "OB", "account_number": "111", "qr_image": PNG_B64},
            headers=auth_headers,
        )
        assert r.status_code == 200
        TestOrders.bank_id = r.json()["id"]
        return TestOrders.bank_id

    def _make_order_payload(self, bank_id):
        return {
            "customer_name": "TEST Customer",
            "customer_email": "test_customer@example.com",
            "customer_phone": "+1234567890",
            "province": "Cavite",
            "town_city": "Dasmarinas",
            "barangay": "Burol",
            "street_house_no": "123 Test Lane",
            "zipcode": "4114",
            "facebook_account": "facebook.com/test.customer",
            "items": [
                {"id": "acqua-di-gio", "name": "Acqua di Gio", "description": "", "price": 399, "quantity": 1, "image": "", "size": "100ml"}
            ],
            "subtotal": 399,
            "total": 399,
            "bank_id": bank_id,
            "bank_name": "TEST_OrderBank",
            "payment_proof": PNG_B64,
        }

    def test_create_order_public(self, session, auth_headers):
        bank_id = self._ensure_bank(session, auth_headers)
        # Public: no auth header
        r = requests.post(f"{BASE_URL}/api/orders", json=self._make_order_payload(bank_id))
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "pending"
        assert body["id"]
        assert body["customer_email"] == "test_customer@example.com"
        assert body["province"] == "Cavite"
        assert body["total"] == 399.0
        TestOrders.order_id_confirm = body["id"]

    def test_list_orders_requires_auth(self, session):
        r = requests.get(f"{BASE_URL}/api/admin/orders")
        assert r.status_code in (401, 403)

    def test_list_orders_admin(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/admin/orders", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        ids = [o["id"] for o in data]
        assert TestOrders.order_id_confirm in ids

    def test_confirm_order(self, session, auth_headers):
        oid = TestOrders.order_id_confirm
        r = session.post(f"{BASE_URL}/api/admin/orders/{oid}/confirm", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "confirmed"

    def test_confirm_shipping(self, session, auth_headers):
        oid = TestOrders.order_id_confirm
        r = session.post(
            f"{BASE_URL}/api/admin/orders/{oid}/ship",
            json={"waybill": "TEST-WAYBILL-123"},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "shipped"
        assert body["waybill"] == "TEST-WAYBILL-123"

    def test_public_order_status_and_receive(self, session):
        oid = TestOrders.order_id_confirm
        r = session.get(f"{BASE_URL}/api/orders/{oid}")
        assert r.status_code == 200
        assert r.json()["status"] == "shipped"

        rr = session.post(f"{BASE_URL}/api/orders/{oid}/receive")
        assert rr.status_code == 200
        assert rr.json()["status"] == "received"

    def test_reject_order(self, session, auth_headers):
        bank_id = self._ensure_bank(session, auth_headers)
        r = requests.post(f"{BASE_URL}/api/orders", json=self._make_order_payload(bank_id))
        assert r.status_code == 200
        oid = r.json()["id"]
        TestOrders.order_id_reject = oid
        rr = session.post(f"{BASE_URL}/api/admin/orders/{oid}/reject", headers=auth_headers)
        assert rr.status_code == 200
        assert rr.json()["status"] == "rejected"

    def test_get_order_admin(self, session, auth_headers):
        oid = TestOrders.order_id_confirm
        r = session.get(f"{BASE_URL}/api/admin/orders/{oid}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["id"] == oid


# ============== Promo Codes ==============
class TestPromoCodes:
    created_id = None
    created_code = None

    def _promo_payload(self):
        now = datetime.now(timezone.utc)
        code = f"TEST_PROMO_{uuid.uuid4().hex[:6].upper()}"
        TestPromoCodes.created_code = code
        return {
            "code": code,
            "amount": 50,
            "starts_at": (now - timedelta(days=1)).isoformat(),
            "ends_at": (now + timedelta(days=1)).isoformat(),
            "active": True,
        }

    def test_create_promo_requires_auth(self, session):
        r = session.post(f"{BASE_URL}/api/admin/promo-codes", json={"code": "NOAUTH", "amount": 10})
        assert r.status_code in (401, 403)

    def test_create_promo_code(self, session, auth_headers):
        payload = self._promo_payload()
        r = session.post(f"{BASE_URL}/api/admin/promo-codes", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["code"] == payload["code"]
        assert body["amount"] == payload["amount"]
        assert body["active"] is True
        assert body["id"]
        TestPromoCodes.created_id = body["id"]

    def test_list_promo_codes_admin(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/admin/promo-codes", headers=auth_headers)
        assert r.status_code == 200, r.text
        codes = [row["code"] for row in r.json()]
        assert TestPromoCodes.created_code in codes

    def test_validate_promo_code_public(self, session):
        r = session.post(f"{BASE_URL}/api/promo-codes/validate", json={"code": TestPromoCodes.created_code, "subtotal": 200})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["valid"] is True
        assert body["code"] == TestPromoCodes.created_code
        assert body["discount_amount"] == 100

    def test_disable_promo_code(self, session, auth_headers):
        pid = TestPromoCodes.created_id
        assert pid
        r = session.post(f"{BASE_URL}/api/admin/promo-codes/{pid}/disable", headers=auth_headers)
        assert r.status_code == 200, r.text
        assert r.json()["active"] is False

    def test_validate_disabled_promo_code_fails(self, session):
        r = session.post(f"{BASE_URL}/api/promo-codes/validate", json={"code": TestPromoCodes.created_code})
        assert r.status_code in (400, 404)


# ============== Cleanup ==============
class TestZCleanup:
    def test_delete_test_banks(self, session, auth_headers):
        # Cleanup any banks created (best-effort)
        r = session.get(f"{BASE_URL}/api/banks")
        assert r.status_code == 200
        for b in r.json():
            if b["name"].startswith("TEST_"):
                session.delete(f"{BASE_URL}/api/admin/banks/{b['id']}", headers=auth_headers)

    def test_delete_test_promo_codes(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/admin/promo-codes", headers=auth_headers)
        assert r.status_code == 200
        for row in r.json():
            if row["code"].startswith("TEST_PROMO_"):
                session.delete(f"{BASE_URL}/api/admin/promo-codes/{row['id']}", headers=auth_headers)
