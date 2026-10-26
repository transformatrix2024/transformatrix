import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.razorpay.com/v1";

// The parts of Razorpay's payment entity we use.
// https://razorpay.com/docs/api/payments/
export type RazorpayPayment = {
  id: string;
  order_id: string | null;
  amount: number; // paise
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  amount_refunded: number;
  error_description?: string | null;
};

export type RazorpayRefund = {
  id: string;
  payment_id: string;
  amount: number;
};

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

async function request<T>(path: string): Promise<T> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not set (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET).");
  }
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error?.description ?? `Razorpay returned HTTP ${res.status}`);
  }
  return body as T;
}

export async function fetchOrderPayments(orderId: string) {
  const res = await request<{ items: RazorpayPayment[] }>(
    `/orders/${encodeURIComponent(orderId)}/payments`,
  );
  return res.items;
}

// Razorpay signs each webhook body with the webhook secret (HMAC-SHA256, hex).
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function paymentDashboardUrl(paymentId: string) {
  return `https://dashboard.razorpay.com/app/payments/${paymentId}`;
}
