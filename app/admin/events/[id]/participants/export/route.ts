import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { registrations, ticketTiers } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { csvResponse } from "@/lib/csv";
import { formatDateTime } from "@/lib/dates";
import { getEvent } from "@/lib/events";
import { paiseToRupeesInput } from "@/lib/money";
import { slugify } from "@/lib/slug";

// Participants (paid) only, e.g. for a check-in list.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const event = await getEvent((await params).id);
  if (!event) return new Response("Event not found", { status: 404 });

  const rows = await db()
    .select({ r: registrations, tier: ticketTiers.name })
    .from(registrations)
    .leftJoin(ticketTiers, eq(ticketTiers.id, registrations.tierId))
    .where(and(eq(registrations.eventId, event.id), eq(registrations.status, "paid")))
    .orderBy(asc(registrations.name));

  return csvResponse(`${slugify(event.title) || "event"}-participants.csv`, [
    ["Name", "Email", "Phone", "Ticket", "Amount (INR)", "Payment", "Paid on", "Checked in", "Razorpay payment ID", "Notes"],
    ...rows.map(({ r, tier }) => [
      r.name,
      r.email,
      r.phone,
      tier,
      paiseToRupeesInput(r.amountPaise),
      r.source,
      formatDateTime(r.paidAt, event.timezone),
      r.checkedInAt ? formatDateTime(r.checkedInAt, event.timezone) : "",
      r.razorpayPaymentId,
      r.notes,
    ]),
  ]);
}
