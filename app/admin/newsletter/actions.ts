"use server";

import { and, asc, eq, inArray, lt, notExists, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { campaignDeliveries, campaigns, subscribers, type Campaign } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { fail, invalid, optionalText, text, type ActionState } from "@/lib/action-state";
import { BATCH_SIZE, emailConfigured, renderNewsletter, sendBatch, sendEmail } from "@/lib/email";
import { isUuid } from "@/lib/ids";
import { siteUrl } from "@/lib/site";
import { STALE_SEND_MS } from "./shared";

const NOT_CONFIGURED =
  "Email sending isn't set up yet. Add RESEND_API_KEY and NEWSLETTER_FROM_EMAIL in Vercel.";

const CampaignInput = z.object({
  subject: z.string().min(1, "Add a subject line.").max(150, "Keep the subject under 150 characters."),
  previewText: z.string().max(150, "Keep the preview under 150 characters.").nullable(),
  contentMd: z.string(),
});

function revalidateNewsletter(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/newsletter");
  if (id) revalidatePath(`/admin/newsletter/${id}`);
}

export async function saveCampaign(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(fd, "id");
  const parsed = CampaignInput.safeParse({
    subject: text(fd, "subject"),
    previewText: optionalText(fd, "previewText"),
    contentMd: text(fd, "contentMd"),
  });
  if (!parsed.success) return invalid(parsed.error);

  if (!id) {
    const [row] = await db().insert(campaigns).values(parsed.data).returning({ id: campaigns.id });
    revalidateNewsletter();
    redirect(`/admin/newsletter/${row.id}?created=1`);
  }

  const updated = isUuid(id)
    ? await db()
        .update(campaigns)
        .set(parsed.data)
        .where(and(eq(campaigns.id, id), inArray(campaigns.status, ["draft", "failed"])))
        .returning({ id: campaigns.id })
    : [];
  if (!updated.length) return fail("This issue has already been sent, so it can't be edited.");
  revalidateNewsletter(id);
  return { ok: true, message: "Saved." };
}

export async function deleteCampaign(id: string): Promise<ActionState> {
  await requireAdmin();
  if (isUuid(id)) {
    // Sent issues are kept as a record of what went out.
    await db()
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), inArray(campaigns.status, ["draft", "failed"])));
  }
  revalidateNewsletter();
  redirect("/admin/newsletter");
}

function unsubscribeLinks(token: string) {
  return {
    page: `${siteUrl()}/newsletter/unsubscribe?token=${token}`,
    oneClick: `${siteUrl()}/api/newsletter/unsubscribe?token=${token}`,
  };
}

function render(campaign: Campaign, unsubscribeUrl: string) {
  return renderNewsletter({
    subject: campaign.subject,
    previewText: campaign.previewText,
    contentMd: campaign.contentMd,
    unsubscribeUrl,
  });
}

export async function sendTestEmail(campaignId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!emailConfigured()) return fail(NOT_CONFIGURED);
  const to = text(fd, "testEmail").toLowerCase();
  if (!z.email().safeParse(to).success) {
    return fail("Enter the email address to send the test to.", { testEmail: ["Enter a valid email."] });
  }
  const campaign = isUuid(campaignId)
    ? await db().query.campaigns.findFirst({ where: eq(campaigns.id, campaignId) })
    : undefined;
  if (!campaign) return fail("This issue no longer exists.");

  try {
    await sendEmail({
      to,
      subject: `[Test] ${campaign.subject}`,
      html: render(campaign, `${siteUrl()}/newsletter/unsubscribe`),
    });
  } catch (err) {
    return fail(`Couldn't send the test: ${err instanceof Error ? err.message : "unknown error"}`);
  }
  return { ok: true, message: `Test sent to ${to}.` };
}

export async function sendCampaign(campaignId: string): Promise<ActionState> {
  await requireAdmin();
  if (!emailConfigured()) return fail(NOT_CONFIGURED);
  if (!isUuid(campaignId)) return fail("This issue no longer exists.");

  const audience = await db().$count(subscribers, eq(subscribers.status, "subscribed"));
  if (audience === 0) return fail("There are no subscribers to send to yet.");

  // Claim the issue so two clicks (or two admins) can't send it twice.
  const [campaign] = await db()
    .update(campaigns)
    .set({ status: "sending", lastError: null })
    .where(
      and(
        eq(campaigns.id, campaignId),
        or(
          inArray(campaigns.status, ["draft", "failed"]),
          and(
            eq(campaigns.status, "sending"),
            lt(campaigns.updatedAt, new Date(Date.now() - STALE_SEND_MS)),
          ),
        ),
      ),
    )
    .returning();
  if (!campaign) return fail("This issue is already sending or has been sent.");
  if (!campaign.contentMd.trim()) {
    await db().update(campaigns).set({ status: "draft" }).where(eq(campaigns.id, campaign.id));
    return fail("The issue is empty. Write it before sending.");
  }

  const sentCount = () => db().$count(campaignDeliveries, eq(campaignDeliveries.campaignId, campaign.id));

  try {
    for (;;) {
      // Next subscribers who haven't received this issue yet.
      const batch = await db()
        .select({ id: subscribers.id, email: subscribers.email, token: subscribers.unsubscribeToken })
        .from(subscribers)
        .where(
          and(
            eq(subscribers.status, "subscribed"),
            notExists(
              db()
                .select({ one: campaignDeliveries.subscriberId })
                .from(campaignDeliveries)
                .where(
                  and(
                    eq(campaignDeliveries.campaignId, campaign.id),
                    eq(campaignDeliveries.subscriberId, subscribers.id),
                  ),
                ),
            ),
          ),
        )
        .orderBy(asc(subscribers.createdAt), asc(subscribers.id))
        .limit(BATCH_SIZE);
      if (!batch.length) break;

      const ids = await sendBatch(
        batch.map((s) => {
          const links = unsubscribeLinks(s.token);
          return {
            to: s.email,
            subject: campaign.subject,
            html: render(campaign, links.page),
            unsubscribeUrl: links.oneClick,
          };
        }),
      );
      await db()
        .insert(campaignDeliveries)
        .values(batch.map((s, i) => ({ campaignId: campaign.id, subscriberId: s.id, resendId: ids[i] ?? null })))
        .onConflictDoNothing();

      // Stay under Resend's default rate limit (2 requests a second).
      if (batch.length === BATCH_SIZE) await new Promise((r) => setTimeout(r, 600));
    }

    const sent = await sentCount();
    await db()
      .update(campaigns)
      .set({ status: "sent", sentAt: new Date(), recipientCount: sent })
      .where(eq(campaigns.id, campaign.id));
    revalidateNewsletter(campaign.id);
    return { ok: true, message: `Sent to ${sent.toLocaleString("en-IN")} subscribers.` };
  } catch (err) {
    const sent = await sentCount();
    const message = err instanceof Error ? err.message : "Unknown error";
    await db()
      .update(campaigns)
      .set({ status: "failed", lastError: message, recipientCount: sent })
      .where(eq(campaigns.id, campaign.id));
    revalidateNewsletter(campaign.id);
    return fail(
      `Sending stopped after ${sent} emails: ${message}. Fix the problem, then press Resume to send to everyone else.`,
    );
  }
}

// ---------- Subscribers ----------

const Email = z.email("Enter a valid email address.");

function revalidateSubscribers() {
  revalidatePath("/admin");
  revalidatePath("/admin/newsletter/subscribers");
}

export async function addSubscriber(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = text(fd, "email").toLowerCase();
  const name = optionalText(fd, "name");
  if (!Email.safeParse(email).success) return fail("Check the email address.", { email: ["Enter a valid email address."] });

  const [row] = await db()
    .insert(subscribers)
    .values({ email, name, source: "admin" })
    .onConflictDoNothing()
    .returning({ id: subscribers.id });
  if (!row) return fail(`${email} is already on the list.`, { email: ["Already on the list."] });
  revalidateSubscribers();
  return { ok: true, message: `Added ${email}.` };
}

// One person per line: "email", "email, name" or "Name <email>".
function parseLine(line: string) {
  const angle = line.match(/^(.*)<([^>]+)>\s*$/);
  if (angle) return { email: angle[2].trim().toLowerCase(), name: angle[1].trim().replace(/^"|"$/g, "") || null };
  const [email, ...rest] = line.split(/[,;\t]/);
  return { email: email.trim().toLowerCase(), name: rest.join(" ").trim() || null };
}

export async function importSubscribers(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const lines = text(fd, "list")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return fail("Paste at least one email address.", { list: ["Nothing to import."] });
  if (lines.length > 5000) return fail("Import at most 5,000 people at a time.", { list: ["Too many lines."] });

  const seen = new Set<string>();
  const valid: { email: string; name: string | null }[] = [];
  let invalidCount = 0;
  for (const line of lines) {
    const person = parseLine(line);
    if (!Email.safeParse(person.email).success) invalidCount++;
    else if (!seen.has(person.email)) {
      seen.add(person.email);
      valid.push(person);
    }
  }

  let added = 0;
  for (let i = 0; i < valid.length; i += 500) {
    const rows = await db()
      .insert(subscribers)
      .values(valid.slice(i, i + 500).map((p) => ({ ...p, source: "import" })))
      .onConflictDoNothing()
      .returning({ id: subscribers.id });
    added += rows.length;
  }
  revalidateSubscribers();

  const parts = [`Added ${added}`];
  if (valid.length - added) parts.push(`${valid.length - added} already on the list`);
  if (invalidCount) parts.push(`${invalidCount} invalid line${invalidCount === 1 ? "" : "s"} skipped`);
  return { ok: added > 0 || invalidCount === 0, message: `${parts.join(", ")}.` };
}

export async function setSubscriberStatus(
  id: string,
  status: "subscribed" | "unsubscribed",
): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id)) return fail("This person is no longer on the list.");
  await db()
    .update(subscribers)
    .set({ status, unsubscribedAt: status === "unsubscribed" ? new Date() : null })
    .where(eq(subscribers.id, id));
  revalidateSubscribers();
  return { ok: true, message: status === "subscribed" ? "Resubscribed." : "Unsubscribed." };
}

export async function deleteSubscriber(id: string): Promise<ActionState> {
  await requireAdmin();
  if (isUuid(id)) await db().delete(subscribers).where(eq(subscribers.id, id));
  revalidateSubscribers();
  return { ok: true, message: "Removed from the list." };
}
