# Promo Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-managed promo codes and let checkout apply them to reduce order totals.

**Architecture:** Keep promo codes persisted in the FastAPI backend so admin CRUD, public validation, and order creation all share one source of truth. Extend the existing admin dashboard with a Promo Codes tab and a modal form, then wire checkout to validate and apply a code before submitting the order.

**Tech Stack:** FastAPI, MongoDB, Next.js App Router, React, TypeScript, existing admin/ui primitives.

---

### Task 1: Backend promo-code model and routes

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_essencia_api.py`

- [ ] **Step 1: Write the failing test**

Add API coverage for admin promo-code CRUD, public validation, and order creation with a discount:

```python
class TestPromoCodes:
    created_id = None

    def test_create_promo_code(self, session, auth_headers):
        code = f"TESTPROMO{uuid.uuid4().hex[:6].upper()}"
        payload = {
            "code": code,
            "amount": 50,
            "starts_at": "2026-06-01T00:00:00+08:00",
            "ends_at": "2026-06-30T23:59:59+08:00",
            "active": True,
        }
        r = session.post(f"{BASE_URL}/api/admin/promo-codes", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["code"] == code
        assert body["amount"] == 50
        assert body["active"] is True
        TestPromoCodes.created_id = body["id"]

    def test_validate_promo_code(self, session):
        r = session.post(f"{BASE_URL}/api/promo-codes/validate", json={"code": "TESTPROMO123456"})
        assert r.status_code == 200
        assert r.json()["valid"] is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_essencia_api.py -k promo -v`
Expected: 404/422 failures because promo routes do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a `PromoCodeIn` model, `promo_codes` collection init/indexing, admin CRUD routes, a public validate route, and order-create logic that recalculates the discount from the stored promo code before inserting the order document.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_essencia_api.py -k promo -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_essencia_api.py
git commit -m "feat: add promo code backend"
```

### Task 2: Admin dashboard promo-code tab

**Files:**
- Modify: `frontend/app/admin/page.tsx`
- Modify: `frontend/lib/api.ts`

- [ ] **Step 1: Write the failing test**

No automated frontend test harness exists in this repo. Verify by loading the admin dashboard and checking for a `Promo Codes` tab, table rows, and an add/edit modal that opens from the tab controls.

- [ ] **Step 2: Run test to verify it fails**

Run the app and open `/admin`.
Expected: no Promo Codes tab yet.

- [ ] **Step 3: Write minimal implementation**

Extend the admin data fetches, add a `Promo Codes` tab, render a table with code/amount/range/status/actions, and add a dialog form for create/edit with code, amount, start date, end date, and active state.

- [ ] **Step 4: Run test to verify it passes**

Open `/admin` and confirm the new tab, add dialog, edit dialog, disable button, and delete button render and respond.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/admin/page.tsx frontend/lib/api.ts
git commit -m "feat: add promo code admin tab"
```

### Task 3: Checkout promo-code application

**Files:**
- Modify: `frontend/app/payment/page.tsx`
- Modify: `frontend/lib/api.ts`

- [ ] **Step 1: Write the failing test**

No automated frontend test harness exists in this repo. Verify by loading `/payment`, entering a promo code, applying it, and confirming the summary total decreases.

- [ ] **Step 2: Run test to verify it fails**

Run the app and open `/payment`.
Expected: no promo-code input yet.

- [ ] **Step 3: Write minimal implementation**

Add a promo-code input plus Apply button in the order summary, call the backend validation route, show the discount line, and submit the applied promo code with the order payload.

- [ ] **Step 4: Run test to verify it passes**

Open `/payment`, apply a valid promo code, and confirm the total updates and the order still submits successfully.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/payment/page.tsx frontend/lib/api.ts
git commit -m "feat: apply promo codes in checkout"
```
