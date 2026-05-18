# Test Credentials

## Admin Dashboard
- URL: `/admin/login`
- Email: `renielperuda2@gmail.com`
- Password: `password123`

The admin is pre-seeded on backend startup from environment variables `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `/app/backend/.env`.

## Database
- MongoDB
- Local defaults: `MONGODB_URI=mongodb://localhost:27017`, `MONGODB_DB=essencia`
- Start local MongoDB and Redis with `docker compose up -d mongodb redis`

## Email (Resend)
- Sender: `onboarding@resend.dev` (Resend default — only delivers to the account owner email `renielperuda2@gmail.com` in test mode)
- API key is in `/app/backend/.env` as `RESEND_API_KEY`
