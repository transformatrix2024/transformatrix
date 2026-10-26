"use server";

import { and, count, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { DISCOUNT_TYPES, EVENT_STATUSES, events, offers, registrations, ticketTiers } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import {
  fail,
  invalid,
  isForeignKeyViolation,
  isUniqueViolation,
  optionalText,
  text,
  type ActionState,
} from "@/lib/action-state";
import { isTimezone, parseLocalDateTime } from "@/lib/dates";
import { isUuid } from "@/lib/ids";
import { parseRupees } from "@/lib/money";
import { syncEventWithRazorpay } from "@/lib/payments";
import { razorpayConfigured } from "@/lib/razorpay";
import { isSlug, slugify } from "@/lib/slug";

const MISSING = "This event no longer exists.";

function revalidateEvent(eventId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  if (eventId) revalidatePath(`/admin/events/${eventId}`, "layout");
}

// Optional whole number from a form field; NaN makes zod report it.
function optionalInt(fd: FormData, name: string) {
  const value = text(fd, name);
  return value ? Number(value) : null;
}

// Empty → null; a value that can't be read → undefined, which zod reports.
function optionalDate(fd: FormData, name: string, timezone: string) {
  const value = text(fd, name);
  if (!value) return null;
  return parseLocalDateTime(value, timezone) ?? undefined;
}

const url = z.url({ protocol: /^https?$/, error: "Enter a full link starting with https://" });
const positiveInt = (what: string) =>
  z.number({ error: `Enter the ${what} as a whole number.` }).int(`Enter the ${what} as a whole number.`).positive(`The ${what} must be more than 0.`);

// ---------- Event ----------

const EventInput = z
  .object({
    title: z.string().min(1, "Give the event a name.").max(200),
    slug: z.string().min(1, "Add a URL slug.").max(80).refine(isSlug, "Use lowercase letters, numbers and dashes only."),
    summary: z.string().max(300, "Keep the summary under 300 characters.").nullable(),
    descriptionMd: z.string(),
    coverImageUrl: url.nullable(),
    timezone: z.string().refine(isTimezone, "Pick a timezone."),
    startsAt: z.date({ error: "Enter when the event starts." }),
    endsAt: z.date({ error: "Enter a valid end time." }).nullable(),
    venueName: z.string().max(200).nullable(),
    venueAddress: z.string().max(500).nullable(),
    onlineUrl: url.nullable(),
    capacity: positiveInt("capacity").nullable(),
    status: z.enum(EVENT_STATUSES),
  })
  .refine((e) => !e.endsAt || e.endsAt >= e.startsAt, {
    path: ["endsAt"],
    message: "The event must end after it starts.",
  });

export async function saveEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(fd, "id");
  const title = text(fd, "title");
  const timezone = text(fd, "timezone");
  const tz = isTimezone(timezone) ? timezone : "UTC";

  const parsed = EventInput.safeParse({
    title,
    slug: text(fd, "slug") || slugify(title),
    summary: optionalText(fd, "summary"),
    descriptionMd: text(fd, "descriptionMd"),
    coverImageUrl: optionalText(fd, "coverImageUrl"),
    timezone,
    startsAt: parseLocalDateTime(text(fd, "startsAt"), tz) ?? undefined,
    endsAt: optionalDate(fd, "endsAt", tz),
    venueName: optionalText(fd, "venueName"),
    venueAddress: optionalText(fd, "venueAddress"),
    onlineUrl: optionalText(fd, "onlineUrl"),
    capacity: optionalInt(fd, "capacity"),
    status: text(fd, "status") || "draft",
  });
  if (!parsed.success) return invalid(parsed.error);

  let eventId = id;
  try {
    if (id) {
      const updated = isUuid(id)
        ? await db().update(events).set(parsed.data).where(eq(events.id, id)).returning({ id: events.id })
        : [];
      if (!updated.length) return fail(MISSING);
    } else {
      const [row] = await db().insert(events).values(parsed.data).returning({ id: events.id });
      eventId = row.id;
    }
  } catch (err) {
    if (isUniqueViolation(err, "events_slug_unique")) {
      return fail("Another event already uses that URL.", { slug: ["Already used by another event."] });
    }
    throw err;
  }

  revalidateEvent(eventId);
  // New event: next step is adding ticket prices.
  if (!id) redirect(`/admin/events/${eventId}/pricing?created=1`);
  return { ok: true, message: "Event saved." };
}

export async function deleteEvent(eventId: string): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(eventId)) return fail(MISSING);
  try {
    await db().delete(events).where(eq(events.id, eventId));
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      return fail("People have registered for this event, so it can't be deleted. Set its status to Cancelled instead.");
    }
    throw err;
  }
  revalidateEvent();
  redirect("/admin/events");
}

// ---------- Ticket types (pricing) ----------

const TierInput = z
  .object({
    name: z.string().min(1, "Name this ticket type.").max(100),
    description: z.string().max(300).nullable(),
    pricePaise: z
      .number({ error: "Enter a price like 1499 or 1499.50 (0 for a free ticket)." })
      .int()
      .min(0)
      .max(1_00_00_000_00, "That price is too high.")
      .refine((p) => p === 0 || p >= 100, "Razorpay's minimum is ₹1. Use 0 for a free ticket."),
    quantity: positiveInt("number of tickets").nullable(),
    salesStartAt: z.date({ error: "Enter a valid date." }).nullable(),
    salesEndAt: z.date({ error: "Enter a valid date." }).nullable(),
    active: z.boolean(),
  })
  .refine((t) => !t.salesStartAt || !t.salesEndAt || t.salesEndAt > t.salesStartAt, {
    path: ["salesEndAt"],
    message: "Sales must end after they start.",
  });

export async function saveTier(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const event = isUuid(eventId) ? await db().query.events.findFirst({ where: eq(events.id, eventId) }) : undefined;
  if (!event) return fail(MISSING);
  const tierId = text(fd, "tierId");

  const parsed = TierInput.safeParse({
    name: text(fd, "name"),
    description: optionalText(fd, "description"),
    pricePaise: parseRupees(text(fd, "price")) ?? undefined,
    quantity: optionalInt(fd, "quantity"),
    salesStartAt: optionalDate(fd, "salesStartAt", event.timezone),
    salesEndAt: optionalDate(fd, "salesEndAt", event.timezone),
    active: fd.get("active") === "on",
  });
  if (!parsed.success) {
    const state = invalid(parsed.error);
    // The form field is "price"; the schema field is pricePaise.
    if (state?.errors?.pricePaise) state.errors.price = state.errors.pricePaise;
    return state;
  }

  if (tierId) {
    if (!isUuid(tierId)) return fail("This ticket type no longer exists.");
    const [{ sold }] = await db()
      .select({ sold: count() })
      .from(registrations)
      .where(and(eq(registrations.tierId, tierId), eq(registrations.status, "paid")));
    if (parsed.data.quantity !== null && parsed.data.quantity < sold) {
      return fail(`${sold} of these tickets are already sold.`, {
        quantity: [`Can't be less than the ${sold} already sold.`],
      });
    }
    const updated = await db()
      .update(ticketTiers)
      .set(parsed.data)
      .where(and(eq(ticketTiers.id, tierId), eq(ticketTiers.eventId, eventId)))
      .returning({ id: ticketTiers.id });
    if (!updated.length) return fail("This ticket type no longer exists.");
  } else {
    await db().insert(ticketTiers).values({ ...parsed.data, eventId });
  }
  revalidateEvent(eventId);
  return { ok: true, message: tierId ? "Ticket type saved." : "Ticket type added." };
}

export async function deleteTier(eventId: string, tierId: string): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(eventId) || !isUuid(tierId)) return fail("This ticket type no longer exists.");
  try {
    await db().delete(ticketTiers).where(and(eq(ticketTiers.id, tierId), eq(ticketTiers.eventId, eventId)));
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      return fail("People have bought this ticket type, so it can't be deleted. Take it off sale instead.");
    }
    throw err;
  }
  revalidateEvent(eventId);
  return { ok: true, message: "Ticket type deleted." };
}

// ---------- Offers ----------

const OfferInput = z
  .object({
    title: z.string().min(1, "Name the offer, e.g. Early bird.").max(100),
    description: z.string().max(300).nullable(),
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: z.number({ error: "Enter the discount." }).int().positive("The discount must be more than 0."),
    tierId: z.uuid().nullable(),
    code: z
      .string()
      .regex(/^[A-Z0-9_-]{3,30}$/, "Use 3–30 letters, numbers, dashes or underscores, without spaces.")
      .nullable(),
    startsAt: z.date({ error: "Enter a valid date." }).nullable(),
    endsAt: z.date({ error: "Enter a valid date." }).nullable(),
    maxRedemptions: positiveInt("limit").nullable(),
    showOnPage: z.boolean(),
    active: z.boolean(),
  })
  .refine((o) => o.discountType !== "percent" || o.discountValue <= 100, {
    path: ["discountValue"],
    message: "A percentage can't be more than 100.",
  })
  .refine((o) => !o.startsAt || !o.endsAt || o.endsAt > o.startsAt, {
    path: ["endsAt"],
    message: "The offer must end after it starts.",
  });

export async function saveOffer(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const event = isUuid(eventId) ? await db().query.events.findFirst({ where: eq(events.id, eventId) }) : undefined;
  if (!event) return fail(MISSING);
  const offerId = text(fd, "offerId");
  const discountType = text(fd, "discountType");
  const rawValue = text(fd, "discountValue");
  const tierId = optionalText(fd, "tierId");

  const parsed = OfferInput.safeParse({
    title: text(fd, "title"),
    description: optionalText(fd, "description"),
    discountType,
    // Percent is a whole number; a flat discount is rupees, stored as paise.
    discountValue:
      discountType === "flat" ? (parseRupees(rawValue) ?? undefined) : rawValue ? Number(rawValue) : undefined,
    tierId,
    code: optionalText(fd, "code")?.toUpperCase() ?? null,
    startsAt: optionalDate(fd, "startsAt", event.timezone),
    endsAt: optionalDate(fd, "endsAt", event.timezone),
    maxRedemptions: optionalInt(fd, "maxRedemptions"),
    showOnPage: fd.get("showOnPage") === "on",
    active: fd.get("active") === "on",
  });
  if (!parsed.success) return invalid(parsed.error);

  if (parsed.data.tierId) {
    const tier = await db().query.ticketTiers.findFirst({
      where: and(eq(ticketTiers.id, parsed.data.tierId), eq(ticketTiers.eventId, eventId)),
    });
    if (!tier) return fail("That ticket type no longer exists.", { tierId: ["Pick a ticket type."] });
  }

  try {
    if (offerId) {
      const updated = isUuid(offerId)
        ? await db()
            .update(offers)
            .set(parsed.data)
            .where(and(eq(offers.id, offerId), eq(offers.eventId, eventId)))
            .returning({ id: offers.id })
        : [];
      if (!updated.length) return fail("This offer no longer exists.");
    } else {
      await db().insert(offers).values({ ...parsed.data, eventId });
    }
  } catch (err) {
    if (isUniqueViolation(err, "offers_event_code_idx")) {
      return fail("Another offer for this event already uses that code.", { code: ["Already used."] });
    }
    throw err;
  }
  revalidateEvent(eventId);
  return { ok: true, message: offerId ? "Offer saved." : "Offer added." };
}

export async function deleteOffer(eventId: string, offerId: string): Promise<ActionState> {
  await requireAdmin();
  if (isUuid(eventId) && isUuid(offerId)) {
    await db().delete(offers).where(and(eq(offers.id, offerId), eq(offers.eventId, eventId)));
  }
  revalidateEvent(eventId);
  return { ok: true, message: "Offer deleted." };
}

// ---------- Participants ----------

const ParticipantInput = z.object({
  name: z.string().min(1, "Enter their name.").max(200),
  email: z.email("Enter a valid email address."),
  phone: z
    .string()
    .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number.")
    .nullable(),
  tierId: z.uuid().nullable(),
  source: z.enum(["offline", "complimentary"]),
  amountPaise: z.number({ error: "Enter the amount they paid, e.g. 1499." }).int().min(0),
  notes: z.string().max(1000).nullable(),
});

// For people who paid outside Razorpay (cash, UPI, bank transfer) or got a
// free pass. Razorpay payments are added automatically.
export async function addParticipant(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const event = isUuid(eventId) ? await db().query.events.findFirst({ where: eq(events.id, eventId) }) : undefined;
  if (!event) return fail(MISSING);

  const source = text(fd, "source");
  const parsed = ParticipantInput.safeParse({
    name: text(fd, "name"),
    email: text(fd, "email").toLowerCase(),
    phone: optionalText(fd, "phone"),
    tierId: optionalText(fd, "tierId"),
    source,
    amountPaise: source === "complimentary" ? 0 : (parseRupees(text(fd, "amount")) ?? undefined),
    notes: optionalText(fd, "notes"),
  });
  if (!parsed.success) {
    const state = invalid(parsed.error);
    if (state?.errors?.amountPaise) state.errors.amount = state.errors.amountPaise;
    return state;
  }
  if (parsed.data.tierId) {
    const tier = await db().query.ticketTiers.findFirst({
      where: and(eq(ticketTiers.id, parsed.data.tierId), eq(ticketTiers.eventId, eventId)),
    });
    if (!tier) return fail("That ticket type no longer exists.", { tierId: ["Pick a ticket type."] });
  }

  await db()
    .insert(registrations)
    .values({ ...parsed.data, eventId, status: "paid", paidAt: new Date() });

  revalidateEvent(eventId);
  const paid = await db().$count(registrations, and(eq(registrations.eventId, eventId), eq(registrations.status, "paid")));
  const over = event.capacity !== null && paid > event.capacity;
  return {
    ok: true,
    message: over
      ? `${parsed.data.name} added. The event is now over capacity (${paid}/${event.capacity}).`
      : `${parsed.data.name} added as a participant.`,
  };
}

export async function toggleCheckIn(eventId: string, registrationId: string): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(eventId) || !isUuid(registrationId)) return fail("This participant no longer exists.");
  const [row] = await db()
    .update(registrations)
    .set({
      checkedInAt: sql`case when ${registrations.checkedInAt} is null then now() else null end`,
    })
    .where(
      and(
        eq(registrations.id, registrationId),
        eq(registrations.eventId, eventId),
        eq(registrations.status, "paid"),
      ),
    )
    .returning({ name: registrations.name, checkedInAt: registrations.checkedInAt });
  if (!row) return fail("Only paid participants can be checked in.");
  revalidateEvent(eventId);
  return { ok: true, message: row.checkedInAt ? `${row.name} checked in.` : `Check-in undone for ${row.name}.` };
}

export async function cancelRegistration(eventId: string, registrationId: string): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(eventId) || !isUuid(registrationId)) return fail("This registration no longer exists.");
  const registration = await db().query.registrations.findFirst({
    where: and(eq(registrations.id, registrationId), eq(registrations.eventId, eventId)),
  });
  if (!registration) return fail("This registration no longer exists.");
  if (registration.source === "razorpay" && registration.status === "paid") {
    return fail(
      "Refund this payment in the Razorpay dashboard. The person is removed from participants automatically once the refund goes through.",
    );
  }
  await db()
    .update(registrations)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(and(eq(registrations.id, registrationId), inArray(registrations.status, ["paid", "pending", "failed"])));
  revalidateEvent(eventId);
  return { ok: true, message: "Registration cancelled." };
}

export async function syncRazorpay(eventId: string): Promise<ActionState> {
  await requireAdmin();
  if (!razorpayConfigured()) {
    return fail("Razorpay isn't connected yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel.");
  }
  if (!isUuid(eventId)) return fail(MISSING);
  const s = await syncEventWithRazorpay(eventId);
  revalidateEvent(eventId);

  if (s.checked === 0) return { ok: true, message: "Nothing to check: no unpaid orders." };
  const parts = [`Checked ${s.checked} unpaid order${s.checked === 1 ? "" : "s"}`];
  if (s.confirmed) parts.push(`${s.confirmed} now paid`);
  if (s.failed) parts.push(`${s.failed} failed`);
  if (s.awaitingCapture) parts.push(`${s.awaitingCapture} authorised but not captured; turn on automatic capture in Razorpay`);
  if (s.errors) parts.push(`${s.errors} couldn't be checked`);
  return { ok: s.errors === 0, message: `${parts.join(", ")}.` };
}
