# Shopiza

Shopiza is a full-stack premium ecommerce web application built with Next.js App Router, TypeScript, Prisma, and SQLite for local development.

It includes:

- Premium storefront UI with responsive product browsing
- Secure client registration, verification, login, and password reset
- Local cart persistence backed by server-side stock reservation logic
- Cash-on-delivery checkout with destination capture
- Admin dashboard for sections, products, discounts, and orders
- Seeded realistic ecommerce data with UUIDs across the database

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma ORM
- SQLite for local development
- Zod validation
- JWT-based HTTP-only cookie sessions with `jose`
- Vitest for unit tests
- ESLint flat config

## Important Notes

- All primary application IDs are UUIDs.
- The seeded admin account is intended for development/bootstrap only.
- Product images in seed data are generated through an internal media route.
- Uploaded admin product images are stored locally in `public/uploads/products`.
- The workspace did not contain an actual Shopiza logo asset file, so the app uses a branded text/mark lockup matched to the requested dark navy, magenta, and purple palette.

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Copy environment variables if needed

```bash
copy .env.example .env
```

3. Generate Prisma client

```bash
npm run db:generate
```

4. Push the schema to the local SQLite database

```bash
npm run db:push
```

5. Seed the database

```bash
npm run db:seed
```

6. Start the development server

```bash
npm run dev
```

## Environment Variables

The project includes `.env.example` and a local `.env` for development.

Required/used variables:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="replace-with-a-long-random-secret"
SHOPIZA_SUPPORT_EMAIL="charbel.g.andraos@gmail.com"
SHOPIZA_APP_URL="http://localhost:3000"
RESEND_API_KEY=""
FROM_EMAIL="Shopiza <onboarding@resend.dev>"
TEST_NOTIFICATION_MODE="capture"
EMAIL_NOTIFICATION_MODE="live"
TEST_NOTIFICATION_EMAIL=""
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=""
```

## Database Commands

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## Default Credentials

Default admin account:

- Username: `admin`
- Email: `charbel.g.andraos@gmail.com`
- Password: `ShopizaAdmin#2026!`
- Role: `ADMIN`

Seeded sample client password:

- Password: `ShopizaClient#2026!`

## Auth and Verification

- Registration creates a `CLIENT` account by default.
- Login accepts email or username plus password.
- Auth sessions are stored in secure HTTP-only cookies and last 7 days.
- Email verification is required before a new account is created.
- Password reset uses email verification codes only.
- For providerless testing, set `TEST_NOTIFICATION_MODE="capture"` and optionally fill `TEST_NOTIFICATION_EMAIL`. Captured emails are written to `.dev/notification-outbox.jsonl`.
- `EMAIL_NOTIFICATION_MODE` can override the global notification mode for email only.

## Cart and Stock Reservation

- Cart state persists locally with a browser-stored cart session ID.
- Stock is reserved server-side when items are added to the cart.
- Stock is restored when quantities are reduced, items are removed, or reservations expire.
- Checkout converts the active reservation into an order.
- Reservation expiry logic helps prevent permanently locked stock from abandoned carts.

## Admin Features

- Dashboard overview
- Section create, update, delete
- Product create, update, delete
- Multi-image product upload and main image selection
- Discount creation and deletion
- Order status updates

When a section is deleted:

- Products are not deleted
- Products are moved to `archived/unassigned`
- Admin can later reassign them to a valid section

## Email Delivery Notes

### Email

- If `EMAIL_NOTIFICATION_MODE="capture"`, emails are not sent through Resend and are written to `.dev/notification-outbox.jsonl` instead.
- Otherwise, emails use `RESEND_API_KEY` and `FROM_EMAIL`.

## Google Maps Notes

- Checkout includes a destination picker that supports:
  - Current browser geolocation
  - Manual address entry
  - Google Places autocomplete when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is configured

If no Google Maps API key is configured:

- The destination field still works as a manual location entry
- Geolocation still works if the browser grants permission

## Testing and Verification

Available commands:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Current verification performed:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Security Notes

Implemented security measures include:

- Password hashing with salted `scrypt`
- Secure HTTP-only auth cookies
- Server-side authorization checks on admin and protected routes
- DB-backed rate limiting on sensitive endpoints
- Shared Zod validation for frontend/backend payloads
- Security event logging support
- Input sanitization for text fields
- Safe Prisma-based database access
- Product upload validation for type and file size
- CSP and additional security headers from Next config
- Proxy-level route protection plus deeper server checks

## Project Structure

High-level layout:

```text
src/
  app/
    admin/
    api/
    products/
    account/
  components/
    admin/
    brand/
    forms/
    layout/
    store/
    ui/
  lib/
    auth/
    security/
    services/
prisma/
  schema.prisma
  seed.ts
proxy.ts
```

## Future Production Hardening

Recommended follow-up work before a public production deployment:

- Move uploads from local disk to object storage
- Replace SQLite with PostgreSQL
- Add integration/e2e tests for auth/cart/checkout/admin flows
- Add richer audit logging for admin mutations
- Rotate the seeded admin password immediately
