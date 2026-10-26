# Transformatrix

Website and admin for Transformatrix: Next.js 16 on Vercel, Postgres on Supabase (through Drizzle), PostHog for session recordings, Razorpay for payments and Resend for the newsletter.

## Admin

`/admin` has the blog, newsletter, events (ticket prices, offers, participants) and session recordings.

Until real login is added, the admin is locked with `ADMIN_PASSWORD`: the browser asks for a password (any username works). Without that variable the admin stays locked in production.

## Environment variables

All names are in [.env.example](.env.example). Set them in Vercel → Settings → Environment Variables and redeploy. Mark the secret ones (`SUPABASE_SECRET_KEY`, `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, `POSTHOG_PERSONAL_API_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`) as Sensitive.

Each admin section explains which variables it is missing, so you can add them one feature at a time.

## Database

- Tables are defined in [db/schema.ts](db/schema.ts). After changing it, run `npm run db:generate` and commit the new file in `db/migrations`.
- To apply migrations: `DIRECT_URL="<session pooler URL>" npm run db:migrate`.
- Every table has row-level security on and no policies, so Supabase's public API can't read them. The app connects to Postgres directly as the owner, verifying Supabase's certificate ([db/tls.ts](db/tls.ts)).
- If the database password contains `@ # / :`, write them as `%40 %23 %2F %3A` in the URLs.

## Payments (Razorpay)

A person is a **participant only once Razorpay confirms their payment**. Until then their registration is `pending`.

1. Checkout (to be built with the public event pages) creates a Razorpay order and a pending registration with that order id.
2. Razorpay calls `/api/razorpay/webhook`. The signature is checked and the registration becomes `paid`, `failed` or `refunded` ([lib/payments.ts](lib/payments.ts)). Every delivery is stored in `razorpay_webhook_events`, so retries are processed once.
3. If a webhook is ever missed, **Sync with Razorpay** on an event's Participants tab asks Razorpay about every unpaid order.

Refunds are made in the Razorpay dashboard; the participant list updates by itself. People who paid offline or get a free pass can be added by hand.

Razorpay setup (in Test Mode first, then again in Live Mode):

- Account & Settings → API Keys → generate a key: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
- Account & Settings → Webhooks → add `https://<your-domain>/api/razorpay/webhook` with a secret (`RAZORPAY_WEBHOOK_SECRET`) and the events `payment.captured`, `order.paid`, `payment.failed` and `refund.processed`.
- Turn on automatic payment capture, so paid orders don't stay "authorised".

## Local development

```sh
npm install
cp .env.example .env.local   # fill in at least DATABASE_URL
npm run dev
```

Open http://localhost:3000/admin. Without `ADMIN_PASSWORD`, the admin is open in development.
