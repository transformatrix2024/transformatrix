import Link from "next/link";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { Download, Search, Trash2, Users } from "lucide-react";
import { db } from "@/db";
import { SUBSCRIBER_STATUSES, subscribers } from "@/db/schema";
import { ActionButton } from "@/components/admin/action-button";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { LinkTabs } from "@/components/admin/link-tabs";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/dates";
import { deleteSubscriber, setSubscriberStatus } from "../actions";
import { NEWSLETTER_TABS } from "../shared";
import { AddSubscriberDialog, ImportSubscribersDialog } from "./subscriber-dialogs";

export const metadata = { title: "Subscribers" };

const PAGE_SIZE = 50;

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = SUBSCRIBER_STATUSES.find((s) => s === params.status);
  const page = Math.max(1, Number(params.page) || 1);

  // Escape LIKE wildcards so a search for "a_b" means exactly that.
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const where = and(
    status ? eq(subscribers.status, status) : undefined,
    q ? or(ilike(subscribers.email, pattern), ilike(subscribers.name, pattern)) : undefined,
  );

  const [rows, counts] = await Promise.all([
    db()
      .select()
      .from(subscribers)
      .where(where)
      .orderBy(desc(subscribers.createdAt))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
    db().select({ status: subscribers.status, n: count() }).from(subscribers).groupBy(subscribers.status),
  ]);
  const hasNext = rows.length > PAGE_SIZE;
  const subscribedCount = counts.find((c) => c.status === "subscribed")?.n ?? 0;
  const unsubscribedCount = counts.find((c) => c.status === "unsubscribed")?.n ?? 0;

  const link = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q: q || undefined, status, page: undefined, ...overrides };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, String(value));
    return next.size ? `/admin/newsletter/subscribers?${next}` : "/admin/newsletter/subscribers";
  };

  return (
    <>
      <PageHeader
        title="Newsletter"
        description="Write issues and email them to your subscribers."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href="/admin/newsletter/subscribers/export">
                <Download /> Export CSV
              </a>
            </Button>
            <ImportSubscribersDialog />
            <AddSubscriberDialog />
          </>
        }
      />
      <LinkTabs className="mb-4" tabs={NEWSLETTER_TABS} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LinkTabs
          tabs={[
            { href: "/admin/newsletter/subscribers", label: `All (${(subscribedCount + unsubscribedCount).toLocaleString("en-IN")})` },
            { href: "/admin/newsletter/subscribers?status=subscribed", label: `Subscribed (${subscribedCount.toLocaleString("en-IN")})` },
            { href: "/admin/newsletter/subscribers?status=unsubscribed", label: `Unsubscribed (${unsubscribedCount.toLocaleString("en-IN")})` },
          ]}
        />
        <form className="relative sm:w-72" action="/admin/newsletter/subscribers">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search email or name" className="pl-8" aria-label="Search subscribers" />
        </form>
      </div>

      {rows.length === 0 ? (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>{q || status ? "Nobody matches" : "No subscribers yet"}</EmptyTitle>
              <EmptyDescription>
                {q || status
                  ? "Try a different search."
                  : "People who sign up on the website will appear here. You can also add or import them."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Email</TableHead>
                <TableHead className="hidden md:table-cell">Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, PAGE_SIZE).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="w-full max-w-0 min-w-48 truncate pl-4 font-medium">{s.email}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{s.name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground capitalize lg:table-cell">{s.source}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(s.createdAt)}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        action={setSubscriberStatus.bind(null, s.id, s.status === "subscribed" ? "unsubscribed" : "subscribed")}
                      >
                        {s.status === "subscribed" ? "Unsubscribe" : "Resubscribe"}
                      </ActionButton>
                      <ConfirmAction
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${s.email}`}>
                            <Trash2 />
                          </Button>
                        }
                        title="Remove this person?"
                        description={`${s.email} will be deleted from the list. To keep a record that they opted out, unsubscribe them instead.`}
                        confirmLabel="Remove"
                        destructive
                        action={deleteSubscriber.bind(null, s.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {(page > 1 || hasNext) && (
        <div className="mt-4 flex justify-between">
          {page > 1 ? (
            <Button variant="outline" asChild>
              <Link href={link({ page: page - 1 > 1 ? page - 1 : undefined })}>Previous</Link>
            </Button>
          ) : (
            <span />
          )}
          {hasNext && (
            <Button variant="outline" asChild>
              <Link href={link({ page: page + 1 })}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
