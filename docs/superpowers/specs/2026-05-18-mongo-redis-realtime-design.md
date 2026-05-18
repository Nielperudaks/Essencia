# Mongo Redis Realtime Backend Design

## Goal

Move the FastAPI backend from Neon/Postgres to MongoDB, add Redis-backed realtime events, and seed local data so the store can be tested on a developer machine.

## Architecture

The backend keeps the current HTTP API response shapes intact while replacing SQL access with MongoDB collections: `admins`, `products`, `banks`, and `orders`. Documents use string `_id` values so existing frontend IDs remain stable: product slugs for products and UUID strings for admins, banks, and orders.

Redis is used as the cross-process realtime event bus. The FastAPI process publishes domain events after product, bank, or order mutations. WebSocket clients subscribe through the backend; admin clients receive collection-change events, and public status clients receive updates for a single order.

## Local Development

Local testing uses Docker Compose services for MongoDB and Redis. The backend reads `MONGODB_URI`, `MONGODB_DB`, and `REDIS_URL`, with local defaults that match the compose file. Startup ensures Mongo indexes exist and seeds the admin account, products, and a starter bank/payment method when collections are empty.

## Data Flow

HTTP writes update MongoDB first. After a successful write, the backend serializes the changed document and publishes an event to Redis. The local process also broadcasts the same event immediately so a single local server works even if Redis is unavailable.

Frontend pages keep their HTTP fetch paths as the source of truth. WebSocket messages update order details directly when the payload includes the relevant order and trigger lightweight refetches for admin list views.

## Error Handling

Mongo unique-key conflicts return the same API errors as the previous Postgres implementation. Redis failures are logged and do not fail checkout or admin actions. WebSocket disconnects are removed from connection registries without affecting active HTTP requests.

## Testing

Unit tests cover Mongo document serialization, seeded data availability, and websocket event routing without requiring real MongoDB or Redis. Existing request-level tests remain compatible with the unchanged HTTP contracts.
