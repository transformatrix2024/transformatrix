import { relations, sql, type SQL } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// Every table has row-level security on and no policies, so Supabase's public
// API (publishable key) can't read or write them. The app talks to Postgres
// directly as the owner, which bypasses RLS. Add policies only when the public
// site needs to read something straight from the browser.

export const POST_STATUSES = ["draft", "published"] as const;
export const SUBSCRIBER_STATUSES = ["subscribed", "unsubscribed"] as const;
export const CAMPAIGN_STATUSES = ["draft", "sending", "sent", "failed"] as const;
export const EVENT_STATUSES = ["draft", "published", "cancelled"] as const;
export const DISCOUNT_TYPES = ["percent", "flat"] as const;
// A registration is a participant only once it is `paid`.
export const REGISTRATION_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
] as const;
// razorpay: paid online; offline: admin recorded cash/UPI/bank transfer;
// complimentary: free pass given by admin; free: a ₹0 ticket.
export const PAYMENT_SOURCES = ["razorpay", "offline", "complimentary", "free"] as const;

function oneOf(column: AnyPgColumn, values: readonly string[]): SQL {
  return sql`${column} in (${sql.raw(values.map((v) => `'${v}'`).join(", "))})`;
}

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const posts = pgTable(
  "posts",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    excerpt: text(),
    contentMd: text().notNull().default(""),
    coverImageUrl: text(),
    author: text(),
    tags: text().array().notNull().default(sql`'{}'::text[]`),
    metaTitle: text(),
    metaDescription: text(),
    status: text({ enum: POST_STATUSES }).notNull().default("draft"),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("posts_status_published_at_idx").on(t.status, t.publishedAt),
    check("posts_status_check", oneOf(t.status, POST_STATUSES)),
  ],
).enableRLS();

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull().unique(), // stored lowercase
    name: text(),
    status: text({ enum: SUBSCRIBER_STATUSES }).notNull().default("subscribed"),
    source: text().notNull().default("admin"),
    unsubscribeToken: uuid().notNull().defaultRandom().unique("subscribers_unsubscribe_token_unique"),
    unsubscribedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("subscribers_status_idx").on(t.status),
    check("subscribers_status_check", oneOf(t.status, SUBSCRIBER_STATUSES)),
  ],
).enableRLS();

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid().primaryKey().defaultRandom(),
    subject: text().notNull(),
    previewText: text(),
    contentMd: text().notNull().default(""),
    status: text({ enum: CAMPAIGN_STATUSES }).notNull().default("draft"),
    recipientCount: integer().notNull().default(0),
    sentAt: timestamp({ withTimezone: true }),
    lastError: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check("campaigns_status_check", oneOf(t.status, CAMPAIGN_STATUSES))],
).enableRLS();

// Who a campaign has already been sent to, so an interrupted send can resume
// without emailing anyone twice.
export const campaignDeliveries = pgTable(
  "campaign_deliveries",
  {
    campaignId: uuid()
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    subscriberId: uuid()
      .notNull()
      .references(() => subscribers.id, { onDelete: "cascade" }),
    resendId: text(),
    sentAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.campaignId, t.subscriberId] })],
).enableRLS();

export const events = pgTable(
  "events",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    summary: text(),
    descriptionMd: text().notNull().default(""),
    coverImageUrl: text(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }),
    timezone: text().notNull().default("Asia/Kolkata"),
    venueName: text(),
    venueAddress: text(),
    onlineUrl: text(),
    capacity: integer(), // null = no overall limit
    status: text({ enum: EVENT_STATUSES }).notNull().default("draft"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("events_starts_at_idx").on(t.startsAt),
    check("events_status_check", oneOf(t.status, EVENT_STATUSES)),
    check("events_capacity_check", sql`${t.capacity} is null or ${t.capacity} > 0`),
    check("events_dates_check", sql`${t.endsAt} is null or ${t.endsAt} >= ${t.startsAt}`),
  ],
).enableRLS();

export const ticketTiers = pgTable(
  "ticket_tiers",
  {
    id: uuid().primaryKey().defaultRandom(),
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    pricePaise: integer().notNull(), // ₹1 = 100 paise; 0 = free ticket
    quantity: integer(), // null = unlimited
    salesStartAt: timestamp({ withTimezone: true }),
    salesEndAt: timestamp({ withTimezone: true }),
    active: boolean().notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("ticket_tiers_event_id_idx").on(t.eventId),
    check("ticket_tiers_price_check", sql`${t.pricePaise} >= 0`),
    check("ticket_tiers_quantity_check", sql`${t.quantity} is null or ${t.quantity} > 0`),
  ],
).enableRLS();

export const offers = pgTable(
  "offers",
  {
    id: uuid().primaryKey().defaultRandom(),
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    // null = applies to every ticket tier of the event
    tierId: uuid().references(() => ticketTiers.id, { onDelete: "cascade" }),
    title: text().notNull(),
    description: text(),
    discountType: text({ enum: DISCOUNT_TYPES }).notNull(),
    // percent: 1–100; flat: amount off in paise
    discountValue: integer().notNull(),
    // null = applied automatically (e.g. early bird); otherwise buyers enter it
    code: text(),
    startsAt: timestamp({ withTimezone: true }),
    endsAt: timestamp({ withTimezone: true }),
    maxRedemptions: integer(), // null = unlimited
    showOnPage: boolean().notNull().default(true),
    active: boolean().notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("offers_event_id_idx").on(t.eventId),
    uniqueIndex("offers_event_code_idx")
      .on(t.eventId, t.code)
      .where(sql`${t.code} is not null`),
    check("offers_discount_type_check", oneOf(t.discountType, DISCOUNT_TYPES)),
    check(
      "offers_discount_value_check",
      sql`${t.discountValue} > 0 and (${t.discountType} <> 'percent' or ${t.discountValue} <= 100)`,
    ),
  ],
).enableRLS();

export const registrations = pgTable(
  "registrations",
  {
    id: uuid().primaryKey().defaultRandom(),
    // restrict: an event or tier with registrations can't be deleted, so
    // payment records are never lost. Cancel or deactivate instead.
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: "restrict" }),
    tierId: uuid().references(() => ticketTiers.id, { onDelete: "restrict" }),
    offerId: uuid().references(() => offers.id, { onDelete: "set null" }),
    name: text().notNull(),
    email: text().notNull(),
    phone: text(),
    amountPaise: integer().notNull().default(0),
    refundedPaise: integer().notNull().default(0),
    currency: text().notNull().default("INR"),
    status: text({ enum: REGISTRATION_STATUSES }).notNull().default("pending"),
    source: text({ enum: PAYMENT_SOURCES }).notNull().default("razorpay"),
    razorpayOrderId: text().unique("registrations_razorpay_order_id_unique"),
    razorpayPaymentId: text().unique("registrations_razorpay_payment_id_unique"),
    paidAt: timestamp({ withTimezone: true }),
    checkedInAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
    refundedAt: timestamp({ withTimezone: true }),
    notes: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("registrations_event_status_idx").on(t.eventId, t.status),
    index("registrations_email_idx").on(t.email),
    check("registrations_status_check", oneOf(t.status, REGISTRATION_STATUSES)),
    check("registrations_source_check", oneOf(t.source, PAYMENT_SOURCES)),
    check("registrations_amount_check", sql`${t.amountPaise} >= 0 and ${t.refundedPaise} >= 0`),
  ],
).enableRLS();

// Every Razorpay webhook we accept, keyed by Razorpay's event id, so a retried
// delivery is processed once and there is an audit trail of payment updates.
export const razorpayWebhookEvents = pgTable("razorpay_webhook_events", {
  id: text().primaryKey(),
  event: text().notNull(),
  payload: jsonb().notNull(),
  receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp({ withTimezone: true }),
  error: text(),
}).enableRLS();

export const eventsRelations = relations(events, ({ many }) => ({
  tiers: many(ticketTiers),
  offers: many(offers),
  registrations: many(registrations),
}));

export const ticketTiersRelations = relations(ticketTiers, ({ one, many }) => ({
  event: one(events, { fields: [ticketTiers.eventId], references: [events.id] }),
  offers: many(offers),
  registrations: many(registrations),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  event: one(events, { fields: [offers.eventId], references: [events.id] }),
  tier: one(ticketTiers, { fields: [offers.tierId], references: [ticketTiers.id] }),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  event: one(events, { fields: [registrations.eventId], references: [events.id] }),
  tier: one(ticketTiers, { fields: [registrations.tierId], references: [ticketTiers.id] }),
  offer: one(offers, { fields: [registrations.offerId], references: [offers.id] }),
}));

export type Post = typeof posts.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Event = typeof events.$inferSelect;
export type TicketTier = typeof ticketTiers.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Registration = typeof registrations.$inferSelect;
