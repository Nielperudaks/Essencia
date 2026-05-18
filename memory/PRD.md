# Essencia Perfume E-commerce — PRD

## Original Problem Statement
> I have here a simple e-commerce website for my perfume website. It is currently incomplete and I want you to create a separate route for an admin dashboard with log in that enables the admin to add item, stocks, image, description, price, and size and connect the data to the main e-commerce site using neon database since currently we only use static data and images to show Items in the site. For Payment, add a new page named 'payment' for the customer and show the selected items inside the cart. The payment will be handled by showing the credit card QR of the owner of the business, use accordion to show the bank name and when you expand it, show qr code from the selected bank and then on the left side of the qr code is a dropdown box for the payment proof, add a button to submit. Once submitted, notify the admin by sending email with link that redirects to payment confirmation or notify the admin dashboard and then confirm the customer's payment.

## Architecture
- **Frontend**: Next.js 16 (App Router, React 19, Tailwind v4) — `/app/frontend/`. Served via `next build` + `next start` in production mode on port 3000.
- **Backend**: FastAPI on port 8001 — `/app/backend/server.py`.
- **Database**: MongoDB. Local development uses `docker-compose.yml` with `MONGODB_URI=mongodb://localhost:27017` and `MONGODB_DB=essencia`.
- **Realtime**: Redis pub/sub plus FastAPI WebSockets. Local development uses `REDIS_URL=redis://localhost:6379/0`.
- **Email**: Resend API (`onboarding@resend.dev` sender, test mode — only delivers to account-owner email).
- **Image Storage**: All admin/customer-uploaded images stored as base64 inside MongoDB documents (no external blob storage).

## User Personas
- **Customer**: Browses products, adds to cart, checks out via the /payment page, uploads payment proof.
- **Admin**: Logs into /admin to manage products, banks (QR codes), and orders. Confirms/rejects pending payments.

## Tech Stack
- Frontend: Next.js 16, React 19, Tailwind v4, shadcn/ui, Motion, Lucide
- Backend: FastAPI, Motor, Redis asyncio client, bcrypt, PyJWT, resend
- DB: MongoDB collections (`admins`, `products`, `banks`, `orders`)
- Auth: JWT (7-day expiry), bcrypt-hashed passwords

## Implemented Features (Session 1 — May 12, 2026)

### Backend (`/app/backend/server.py`)
- `GET /api/health`
- `POST /api/admin/login`, `GET /api/admin/me`
- Products: `GET /api/products`, `GET /api/products/{id}`, admin CRUD `POST/PUT/DELETE /api/admin/products[/id]`
- Banks: `GET /api/banks`, admin CRUD `POST/PUT/DELETE /api/admin/banks[/id]`
- Orders: `POST /api/orders` (public), `GET /api/admin/orders`, `GET /api/admin/orders/{id}`, `POST /api/admin/orders/{id}/confirm`, `POST /api/admin/orders/{id}/reject`
- Auto-seeds admin from env `ADMIN_EMAIL/ADMIN_PASSWORD`, four perfume products, and a starter GCash payment method on startup.
- Publishes order/product/bank changes over Redis and exposes WebSocket routes for realtime admin and order-status updates.
- Non-blocking Resend email notification to admin on every new order (HTML body with link to `/admin/orders/{id}`).

### Frontend
- Homepage `/` — hero, dynamic product grid (fetches from API)
- Shop `/shop` — full product list with category filter
- Product detail `/product/[id]` — Add to Cart + Buy Now
- Cart drawer — opens on Add; Checkout button → `/payment`
- Payment page `/payment` — cart items, customer info form, bank accordion (each bank shows QR + payment-proof uploader + submit), order summary sidebar
- Payment success `/payment/success/[orderId]` — Thank-you page
- Admin login `/admin/login` — JWT auth, route protection on `/admin/**`
- Admin dashboard `/admin` — tabs for Orders / Products / Banks
  - Orders table with status, view modal showing customer info + items + payment proof + Confirm/Reject
  - Products CRUD with image upload (base64), name, description, price, stock, size, category, badge
  - Banks CRUD with name, account name/number, QR image upload (base64)
- Admin order detail `/admin/orders/[id]` — dedicated page linked from notification email

## Status
- Backend: MongoDB/Redis migration in progress with focused unit coverage for document mapping and realtime routing.
- Frontend: ~95% E2E coverage passing (testing agent iteration 2). Full checkout flow verified.

## Known/Deferred Items (Backlog)
- P2 Add the missing `data-testid="order-detail-page"` and `confirm/reject` testids on `/admin/orders/[id]` for regression coverage.
- P2 Replace the Vercel Analytics import (`@vercel/analytics`) — currently emits a benign 404 for `/_vercel/insights/script.js`.
- P2 Add stable UUID-based testids alongside slug-based ones for admin product rows.
- P2 Switch from base64-in-MongoDB to a real blob store (S3/Vercel Blob) when image sizes scale beyond a few MB.

## Next Action Items
- Customer-facing: order tracking page (lookup by email + order id).
- Admin: bulk product import, low-stock alerts.
- Resend: verify a real domain for production so emails reach customers (currently test-mode sender).
