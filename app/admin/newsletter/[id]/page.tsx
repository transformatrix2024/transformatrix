import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { db } from "@/db";
import { campaigns, subscribers } from "@/db/schema";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { FlashToast } from "@/components/admin/flash-toast";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import { emailConfigured } from "@/lib/email";
import { isUuid } from "@/lib/ids";
import { deleteCampaign, sendCampaign, sendTestEmail } from "../actions";
import { CampaignForm } from "../campaign-form";
import { SendPanel } from "../send-panel";
import { STALE_SEND_MS } from "../shared";

export const metadata = { title: "Newsletter issue" };

// Sending to a large list can take a while.
export const maxDuration = 300;

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const campaign = isUuid(id) ? await db().query.campaigns.findFirst({ where: eq(campaigns.id, id) }) : undefined;
  if (!campaign) notFound();

  const audience = await db().$count(subscribers, eq(subscribers.status, "subscribed"));
  const interrupted =
    campaign.status === "sending" && Date.now() - campaign.updatedAt.getTime() > STALE_SEND_MS;
  const editable = campaign.status === "draft" || campaign.status === "failed";

  return (
    <>
      <FlashToast message="Draft saved." />
      <PageHeader
        title={campaign.subject}
        back={{ href: "/admin/newsletter", label: "Newsletter" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={campaign.status} />
            {campaign.sentAt
              ? `Sent ${formatDateTime(campaign.sentAt)} to ${campaign.recipientCount.toLocaleString("en-IN")} people`
              : campaign.recipientCount > 0
                ? `${campaign.recipientCount.toLocaleString("en-IN")} sent so far`
                : null}
          </span>
        }
        actions={
          editable && (
            <ConfirmAction
              trigger={
                <Button variant="destructive">
                  <Trash2 /> Delete
                </Button>
              }
              title="Delete this issue?"
              description="The draft will be removed. This can't be undone."
              confirmLabel="Delete issue"
              destructive
              action={deleteCampaign.bind(null, campaign.id)}
            />
          )
        }
      />

      {editable || interrupted ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {editable ? (
            <CampaignForm campaign={campaign} />
          ) : (
            <SentPreview subject={campaign.subject} contentMd={campaign.contentMd} />
          )}
          <SendPanel
            audience={audience}
            resume={campaign.status === "failed" || interrupted}
            lastError={campaign.lastError}
            emailReady={emailConfigured()}
            sendTest={sendTestEmail.bind(null, campaign.id)}
            sendAll={sendCampaign.bind(null, campaign.id)}
          />
        </div>
      ) : (
        <SentPreview subject={campaign.subject} contentMd={campaign.contentMd} />
      )}
    </>
  );
}

function SentPreview({ subject, contentMd }: { subject: string; contentMd: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{subject}</CardTitle>
        <CardDescription>What subscribers received.</CardDescription>
      </CardHeader>
      <CardContent>
        <Markdown>{contentMd}</Markdown>
      </CardContent>
    </Card>
  );
}
