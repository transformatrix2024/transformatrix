# Transformatrix

The Transformatrix website and its admin. Built with Next.js 16 (App Router) on Vercel, Postgres on Supabase (through Drizzle), PostHog for session recordings, Razorpay for payments and Resend for the newsletter.

- **Public website**: `/`, `/programs`, `/calendar`, `/about`, `/blog`, `/shop`. Built from the wireframes; copy, images and dates are placeholders until the final content arrives.
- **Admin**: `/admin`, with the blog, newsletter, events (ticket prices, offers, participants) and session recordings.

## Project structure

Everything lives in `src/`. The `@/` import alias points there (`@/lib/money` is `src/lib/money.ts`).

```
src/
├── app/                      Routes only (Next.js App Router)
│   ├── (site)/               Public website; the (site) folder name doesn't appear in URLs
│   │   ├── page.tsx          Landing page
│   │   ├── programs/         Programs hub + one template for every program (/programs/[slug])
│   │   ├── calendar/         Upcoming dates (list and month view)
│   │   ├── about/            Our story, /about/facilitators
│   │   ├── blog/  shop/  contact/  thank-you/
│   │   └── layout.tsx        Shared footer
│   ├── admin/                Admin dashboard; each section keeps its pages, forms and
│   │                         server actions (actions.ts) side by side
│   ├── api/                  Webhooks and public endpoints (Razorpay, one-click unsubscribe)
│   ├── newsletter/           Public unsubscribe page
│   ├── layout.tsx            Root layout: fonts, metadata
│   └── globals.css           Tailwind, theme colours, public-site palette
├── components/
│   ├── ui/                   shadcn/ui building blocks (generated; add more with `npx shadcn add`)
│   ├── site/                 Public website components (navigation, floating calendar, footer…)
│   ├── admin/                Admin components (sidebar, forms, dialogs…)
│   └── shared/               Used by both (Markdown renderer)
├── content/                  Website copy and structure: navigation, programs, sample dates,
│                             blog categories, facilitators, FAQ
├── server/                   Code that must only run on the server (marked `import "server-only"`)
│   ├── db/                   Drizzle schema, connection, TLS and SQL migrations
│   ├── auth/                 Admin password lock (used by proxy.ts and every admin action)
│   ├── integrations/         Third-party APIs: Razorpay, PostHog, Resend, Supabase Storage
│   └── services/             Business logic: payment status changes, unsubscribe, event lookup
├── lib/                      Small helpers safe on server and in the browser: money, dates,
│                             calendar grids, slugs, pricing, CSV, form-state types
├── proxy.ts                  Locks /admin behind the password (Next.js "proxy", formerly middleware)
└── instrumentation-client.ts Starts PostHog on the public site
```

Where to put new code:

- A new page goes in `src/app/(site)/…` (public) or `src/app/admin/…` (admin).
- Anything that touches the database, secrets or a third-party API goes in `src/server/`, never in a component.
- A component used by one admin page can sit next to that page; one used in several places goes in `src/components/`.
- Copy and placeholder content go in `src/content/`, so pages stay free of hard-coded text lists.

## Environment variables

All names are in [.env.example](.env.example). Set them in Vercel → Settings → Environment Variables and redeploy. Mark the secret ones (`SUPABASE_SECRET_KEY`, `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, `POSTHOG_PERSONAL_API_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`) as Sensitive.

Each admin section explains which variables it is missing, so you can add them one feature at a time. The public website needs none of them yet.

## Admin access

Until real login is added, `/admin` is locked with `ADMIN_PASSWORD`: the browser asks for a password (any username works). Without that variable the admin stays locked in production and open in local development.

## Database

- Tables are defined in [src/server/db/schema.ts](src/server/db/schema.ts). After changing it, run `npm run db:generate` and commit the new file in `src/server/db/migrations`.
- To apply migrations: `DIRECT_URL="<session pooler URL>" npm run db:migrate`.
- Every table has row-level security on and no policies, so Supabase's public API can't read them. The app connects to Postgres directly as the owner, verifying Supabase's certificate ([src/server/db/tls.ts](src/server/db/tls.ts)).
- If the database password contains `@ # / :`, write them as `%40 %23 %2F %3A` in the URLs.

## Payments (Razorpay)

A person is a **participant only once Razorpay confirms their payment**. Until then their registration is `pending`.

1. Checkout (still to be built, from the Upcoming dates page) creates a Razorpay order and a pending registration with that order id.
2. Razorpay calls `/api/razorpay/webhook`. The signature is checked and the registration becomes `paid`, `failed` or `refunded` ([src/server/services/payments.ts](src/server/services/payments.ts)). Every delivery is stored in `razorpay_webhook_events`, so retries are processed once.
3. If a webhook is ever missed, **Sync with Razorpay** on an event's Participants tab asks Razorpay about every unpaid order.

Refunds are made in the Razorpay dashboard; the participant list updates by itself. People who paid offline or get a free pass can be added by hand.

Razorpay setup (in Test Mode first, then again in Live Mode):

- Account & Settings → API Keys → generate a key: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
- Account & Settings → Webhooks → add `https://<your-domain>/api/razorpay/webhook` with a secret (`RAZORPAY_WEBHOOK_SECRET`) and the events `payment.captured`, `order.paid`, `payment.failed` and `refund.processed`.
- Turn on automatic payment capture, so paid orders don't stay "authorised".

## Local development

```sh
npm install
cp .env.example .env.local   # fill in at least DATABASE_URL for the admin
npm run dev
```

Open http://localhost:3000 for the website and http://localhost:3000/admin for the admin.
