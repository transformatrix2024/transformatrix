import Link from "next/link";
import { desc } from "drizzle-orm";
import { Mail, Plus } from "lucide-react";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { LinkTabs } from "@/components/admin/link-tabs";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import { emailConfigured } from "@/lib/email";
import { NEWSLETTER_TABS } from "./shared";

export const metadata = { title: "Newsletter" };

export default async function NewsletterPage() {
  await requireAdmin();
  const rows = await db().select().from(campaigns).orderBy(desc(campaigns.updatedAt));

  return (
    <>
      <PageHeader
        title="Newsletter"
        description="Write issues and email them to your subscribers."
        actions={
          <Button asChild>
            <Link href="/admin/newsletter/new">
              <Plus /> New issue
            </Link>
          </Button>
        }
      />
      <LinkTabs className="mb-4" tabs={NEWSLETTER_TABS} />

      {!emailConfigured() && (
        <div className="mb-4">
          <NotConfigured
            title="Email sending isn't set up yet"
            description="You can write issues now; sending needs a Resend account with your domain verified."
            vars={[
              { name: "RESEND_API_KEY", hint: "resend.com → API Keys → Create API key (sending access)." },
              {
                name: "NEWSLETTER_FROM_EMAIL",
                hint: 'Who it\'s from, e.g. "Transformatrix <hello@transformatrix.life>". The domain must be verified in Resend.',
              },
            ]}
          />
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Mail />
              </EmptyMedia>
              <EmptyTitle>No issues yet</EmptyTitle>
              <EmptyDescription>Newsletter issues you write show up here.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/admin/newsletter/new">Write the first issue</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Recipients</TableHead>
                <TableHead className="hidden pr-4 md:table-cell">Sent / edited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="w-full max-w-0 pl-4">
                    <Link href={`/admin/newsletter/${c.id}`} className="block truncate font-medium hover:underline">
                      {c.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {c.status === "draft" ? "—" : c.recipientCount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="hidden pr-4 text-muted-foreground md:table-cell">
                    {formatDateTime(c.sentAt ?? c.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
