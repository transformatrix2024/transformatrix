import { marked } from "marked";
import { Resend } from "resend";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.NEWSLETTER_FROM_EMAIL);
}

function resend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set.");
  return new Resend(process.env.RESEND_API_KEY);
}

function from() {
  const address = process.env.NEWSLETTER_FROM_EMAIL;
  if (!address) throw new Error("NEWSLETTER_FROM_EMAIL is not set.");
  return address;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Markdown → a simple email-safe page. Content comes from admins only.
export function renderNewsletter({
  subject,
  previewText,
  contentMd,
  unsubscribeUrl,
}: {
  subject: string;
  previewText?: string | null;
  contentMd: string;
  unsubscribeUrl: string;
}) {
  const body = (marked.parse(contentMd, { async: false }) as string).replace(
    /<img /g,
    '<img style="max-width:100%;height:auto;border-radius:8px;" ',
  );
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#18181b;">
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(previewText)}</div>` : ""}
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="font-weight:700;font-size:20px;letter-spacing:-0.02em;margin-bottom:20px;">Transformatrix</div>
  <div style="background:#ffffff;border-radius:12px;padding:28px 24px;font-size:16px;line-height:1.65;">
    ${body}
  </div>
  <p style="font-size:12px;color:#71717a;margin-top:20px;text-align:center;">
    You're getting this because you subscribed to Transformatrix updates.
    <a href="${unsubscribeUrl}" style="color:#71717a;">Unsubscribe</a>
  </p>
</div>
</body></html>`;
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  unsubscribeUrl?: string;
};

function toResend(email: OutgoingEmail) {
  return {
    from: from(),
    to: email.to,
    subject: email.subject,
    html: email.html,
    // Lets Gmail/Yahoo show a one-click "Unsubscribe" button.
    headers: email.unsubscribeUrl
      ? {
          "List-Unsubscribe": `<${email.unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }
      : undefined,
  };
}

export async function sendEmail(email: OutgoingEmail) {
  const { data, error } = await resend().emails.send(toResend(email));
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

// Resend accepts up to 100 emails per batch call. Returns the Resend id of
// each email, in order.
export const BATCH_SIZE = 100;

export async function sendBatch(emails: OutgoingEmail[]) {
  const { data, error } = await resend().batch.send(emails.map(toResend));
  if (error) throw new Error(error.message);
  return (data?.data ?? []).map((d) => d.id);
}
