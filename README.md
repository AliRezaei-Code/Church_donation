# Church Tithing MVP

This is a minimal tithing platform built with Next.js, Prisma, Stripe Checkout, and NextAuth.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your configuration. For local development with SQLite use:
   ```env
   DATABASE_PROVIDER="sqlite"
   DATABASE_URL="file:./dev.db"
   ```
4. Push the database schema:
   ```bash
   npm run db:push
   ```
5. Generate the Prisma client:
   ```bash
   npm run prisma:generate
   ```
6. Seed an admin user (requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`):
   ```bash
   npm run seed:admin
   ```
7. Start the development server:
   ```bash
   npm run dev
   ```

## Stripe webhook

Forward Stripe events locally with the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Testing the flow

1. Create a checkout session by using the donor form on `/`.
2. Complete the Stripe Checkout in test mode.
3. Webhook events update donation status and send receipts.

## Testing

Basic smoke tests can be implemented with Vitest. Run:

```bash
npm test
```
