# Test Credentials

## Admin Dashboard
- URL: `/admin/login`
- Email: `renielperuda2@gmail.com`
- Password: `password123`

The admin is pre-seeded on backend startup from environment variables `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `/app/backend/.env`.

## Database
- Neon Postgres (managed)
- Connection string is in `/app/backend/.env` as `DATABASE_URL`

## Email (Resend)
- Sender: `onboarding@resend.dev` (Resend default — only delivers to the account owner email `renielperuda2@gmail.com` in test mode)
- API key is in `/app/backend/.env` as `RESEND_API_KEY`
