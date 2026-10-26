import { and, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { fetchOrderPayments, type RazorpayPayment, type RazorpayRefund } from "./razorpay";

// Every change to a registration's payment status goes through here, whether
// it comes from Razorpay's webhook or from the admin's "Sync with Razorpay".
// Each function is safe to call more than once with the same payment.

export type PaymentOutcome =
  | "confirmed"
  | "already-recorded"
  | "unknown-order"
  | "amount-mismatch"
  | "marked-failed"
  | "refund-recorded"
  | "ignored";

async function findByOrder(orderId: string | null) {
  if (!orderId) return undefined;
  const [registration] = await db()
    .select()
    .from(registrations)
    .where(eq(registrations.razorpayOrderId, orderId));
  return registration;
}

// The payment is captured (money taken): the person becomes a participant.
export async function recordCapturedPayment(
  payment: Pick<RazorpayPayment, "id" | "order_id" | "amount">,
): Promise<PaymentOutcome> {
  const registration = await findByOrder(payment.order_id);
  // Not one of ours, e.g. a payment link the client made in the Razorpay dashboard.
  if (!registration) return "unknown-order";
  if (registration.razorpayPaymentId === payment.id || registration.status === "paid") {
    return "already-recorded";
  }
  // The order amount is set by our server, so a mismatch means something is
  // wrong; leave it for a person to check rather than confirming it.
  if (payment.amount !== registration.amountPaise) return "amount-mismatch";

  const updated = await db()
    .update(registrations)
    .set({ status: "paid", razorpayPaymentId: payment.id, paidAt: new Date() })
    .where(
      and(
        eq(registrations.id, registration.id),
        or(
          inArray(registrations.status, ["pending", "failed"]),
          // Money arrived after the pending order was cancelled: still honour it.
          and(eq(registrations.status, "cancelled"), isNull(registrations.razorpayPaymentId)),
        ),
      ),
    )
    .returning({ id: registrations.id });
  return updated.length ? "confirmed" : "already-recorded";
}

// A payment attempt failed. Razorpay lets the buyer retry on the same order,
// so a later capture still moves this to paid.
export async function recordFailedPayment(
  payment: Pick<RazorpayPayment, "order_id">,
): Promise<PaymentOutcome> {
  const registration = await findByOrder(payment.order_id);
  if (!registration) return "unknown-order";
  const updated = await db()
    .update(registrations)
    .set({ status: "failed" })
    .where(and(eq(registrations.id, registration.id), eq(registrations.status, "pending")))
    .returning({ id: registrations.id });
  return updated.length ? "marked-failed" : "already-recorded";
}

// `totalRefundedPaise` is the payment's total refunded so far (Razorpay's
// amount_refunded), so replays don't double count. A full refund ends the
// participation; a partial refund keeps them as a participant.
export async function recordRefund(
  refund: Pick<RazorpayRefund, "payment_id" | "amount">,
  totalRefundedPaise?: number,
): Promise<PaymentOutcome> {
  const [registration] = await db()
    .select()
    .from(registrations)
    .where(eq(registrations.razorpayPaymentId, refund.payment_id));
  if (!registration) return "unknown-order";

  const refunded = Math.min(
    totalRefundedPaise ?? registration.refundedPaise + refund.amount,
    registration.amountPaise,
  );
  const fullyRefunded = refunded >= registration.amountPaise;
  await db()
    .update(registrations)
    .set({
      refundedPaise: refunded,
      ...(fullyRefunded ? { status: "refunded" as const, refundedAt: new Date() } : {}),
    })
    .where(eq(registrations.id, registration.id));
  return "refund-recorded";
}

type WebhookBody = {
  event: string;
  payload?: {
    payment?: { entity: RazorpayPayment };
    refund?: { entity: RazorpayRefund };
  };
};

export async function handleRazorpayEvent(body: WebhookBody): Promise<PaymentOutcome> {
  const payment = body.payload?.payment?.entity;
  switch (body.event) {
    case "payment.captured":
    case "order.paid":
      return payment ? recordCapturedPayment(payment) : "ignored";
    case "payment.failed":
      return payment ? recordFailedPayment(payment) : "ignored";
    case "refund.processed": {
      const refund = body.payload?.refund?.entity;
      return refund ? recordRefund(refund, payment?.amount_refunded) : "ignored";
    }
    default:
      return "ignored";
  }
}

export type SyncSummary = {
  checked: number;
  confirmed: number;
  failed: number;
  awaitingCapture: number;
  errors: number;
};

// Backstop for missed webhooks: ask Razorpay about every unpaid order of an
// event and record anything that was captured.
export async function syncEventWithRazorpay(eventId: string): Promise<SyncSummary> {
  const open = await db()
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        inArray(registrations.status, ["pending", "failed"]),
        isNotNull(registrations.razorpayOrderId),
      ),
    );

  const summary: SyncSummary = { checked: 0, confirmed: 0, failed: 0, awaitingCapture: 0, errors: 0 };
  for (const registration of open) {
    summary.checked++;
    try {
      const payments = await fetchOrderPayments(registration.razorpayOrderId!);
      const captured = payments.find((p) => p.status === "captured" || p.status === "refunded");
      if (captured) {
        if ((await recordCapturedPayment(captured)) === "confirmed") summary.confirmed++;
        if (captured.amount_refunded > 0) {
          await recordRefund(
            { payment_id: captured.id, amount: captured.amount_refunded },
            captured.amount_refunded,
          );
        }
      } else if (payments.some((p) => p.status === "authorized")) {
        // Authorised but not captured: turn on automatic capture in Razorpay.
        summary.awaitingCapture++;
      } else if (payments.length && payments.every((p) => p.status === "failed")) {
        if ((await recordFailedPayment(payments[0])) === "marked-failed") summary.failed++;
      }
    } catch {
      summary.errors++;
    }
  }
  return summary;
}
