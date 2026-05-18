# Mongo Redis Realtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Neon/Postgres persistence with MongoDB, add Redis-backed websocket events, and provide local seeds/services.

**Architecture:** FastAPI keeps the same REST API contract while using Motor collections with string IDs. Redis pub/sub carries realtime change events, and websocket routes expose those events to admin and order-status clients.

**Tech Stack:** FastAPI, Motor, Redis asyncio client, MongoDB, Redis, Next.js browser WebSocket API.

---

### Task 1: Backend Mongo Storage

**Files:**
- Modify: `backend/server.py`
- Modify: `backend/requirements.txt`
- Test: `backend/tests/test_mongo_realtime_contract.py`

- [ ] Add failing tests for document mappers, seeded bank data, and local connection defaults.
- [ ] Replace asyncpg schema/init code with Motor client startup, Mongo indexes, idempotent seeders, and document helpers.
- [ ] Update all CRUD routes to use MongoDB collections and preserve response JSON shapes.
- [ ] Run backend unit tests.

### Task 2: Redis and WebSockets

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_mongo_realtime_contract.py`

- [ ] Add failing tests for event routing to admin and order-specific websocket groups.
- [ ] Add a realtime manager, Redis publish/subscribe setup, and websocket routes `/ws/admin` and `/ws/orders/{order_id}`.
- [ ] Publish events after order, product, and bank mutations.
- [ ] Run backend unit tests.

### Task 3: Frontend Realtime Hooks

**Files:**
- Modify: `frontend/lib/api.ts`
- Modify: `frontend/app/admin/page.tsx`
- Modify: `frontend/app/status/page.tsx`
- Modify: `frontend/app/admin/orders/[id]/page.tsx`

- [ ] Add websocket URL helpers beside the current HTTP API helper.
- [ ] Replace admin order polling with websocket-triggered refresh and keep HTTP refresh after mutations.
- [ ] Subscribe order-status and admin-order-detail pages to order-specific events.
- [ ] Run frontend lint.

### Task 4: Local Services and Docs

**Files:**
- Create: `docker-compose.yml`
- Modify: `memory/PRD.md`

- [ ] Add MongoDB and Redis compose services with ports matching backend defaults.
- [ ] Document the new env vars and local startup flow.
- [ ] Run targeted backend tests and frontend lint/build where available.
