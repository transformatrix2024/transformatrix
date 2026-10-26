import { eq } from "drizzle-orm";
import { db } from "@/db";
import { razorpayWebhookEvents } from "@/db/schema";
import { handleRazorpayEvent, type PaymentOutcome } from "@/lib/payments";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Razorpay → Settings → Webhooks points here. Subscribe to payment.captured,
// order.paid, payment.failed and refund.processed.
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook secret not configured" }, { status: 503 });

  // The signature covers the exact bytes sent, so verify before parsing.
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: Parameters<typeof handleRazorpayEvent>[0] & { created_at?: number };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Razorpay retries until it gets a 2xx; the event id lets us skip repeats.
  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    `${body.event}:${body.payload?.payment?.entity.id ?? body.payload?.refund?.entity.id ?? body.created_at}`;

  const [seen] = await db()
    .select({ processedAt: razorpayWebhookEvents.processedAt })
    .from(razorpayWebhookEvents)
    .where(eq(razorpayWebhookEvents.id, eventId));
  if (seen?.processedAt) return Response.json({ ok: true, duplicate: true });
  if (!seen) {
    await db()
      .insert(razorpayWebhookEvents)
      .values({ id: eventId, event: body.event, payload: body })
      .onConflictDoNothing();
  }

  let outcome: PaymentOutcome;
  try {
    outcome = await handleRazorpayEvent(body);
  } catch (err) {
    await db()
      .update(razorpayWebhookEvents)
      .set({ error: err instanceof Error ? err.message : String(err) })
      .where(eq(razorpayWebhookEvents.id, eventId));
    // A 5xx makes Razorpay retry later.
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  // Outcomes that need a human look are kept in `error` for the audit trail.
  const needsLook = outcome === "amount-mismatch" || outcome === "unknown-order";
  await db()
    .update(razorpayWebhookEvents)
    .set({ processedAt: new Date(), error: needsLook ? outcome : null })
    .where(eq(razorpayWebhookEvents.id, eventId));
  return Response.json({ ok: true, outcome });
}
