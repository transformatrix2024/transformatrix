import Link from "next/link";
import { and, asc, count, desc, eq, gte, ne, sql } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import { db } from "@/db";
import { events, posts, registrations, subscribers } from "@/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import { formatPaise } from "@/lib/money";

export default async function OverviewPage() {
  await requireAdmin();
  const now = new Date();

  const [postCounts, subscriberCount, upcoming, [totals], recentParticipants, recentPosts] =
    await Promise.all([
      db().select({ status: posts.status, n: count() }).from(posts).groupBy(posts.status),
      db().$count(subscribers, eq(subscribers.status, "subscribed")),
      db()
        .select({
          id: events.id,
          title: events.title,
          startsAt: events.startsAt,
          timezone: events.timezone,
          status: events.status,
          capacity: events.capacity,
          participants: sql<number>`count(${registrations.id}) filter (where ${registrations.status} = 'paid')`.mapWith(Number),
        })
        .from(events)
        .leftJoin(registrations, eq(registrations.eventId, events.id))
        .where(and(gte(events.startsAt, now), ne(events.status, "cancelled")))
        .groupBy(events.id)
        .orderBy(asc(events.startsAt))
        .limit(5),
      db()
        .select({
          participants: count(),
          revenue: sql<number>`coalesce(sum(${registrations.amountPaise} - ${registrations.refundedPaise}), 0)`.mapWith(Number),
        })
        .from(registrations)
        .where(eq(registrations.status, "paid")),
      db()
        .select({
          id: registrations.id,
          name: registrations.name,
          amountPaise: registrations.amountPaise,
          paidAt: registrations.paidAt,
          eventId: events.id,
          eventTitle: events.title,
        })
        .from(registrations)
        .innerJoin(events, eq(events.id, registrations.eventId))
        .where(eq(registrations.status, "paid"))
        .orderBy(desc(registrations.paidAt))
        .limit(6),
      db()
        .select({ id: posts.id, title: posts.title, status: posts.status, updatedAt: posts.updatedAt })
        .from(posts)
        .orderBy(desc(posts.updatedAt))
        .limit(5),
    ]);

  const published = postCounts.find((p) => p.status === "published")?.n ?? 0;
  const drafts = postCounts.find((p) => p.status === "draft")?.n ?? 0;

  const stats = [
    { label: "Participants", value: totals.participants.toLocaleString("en-IN"), note: "Paid, all events", href: "/admin/events" },
    { label: "Revenue", value: formatPaise(totals.revenue), note: "After refunds", href: "/admin/events" },
    { label: "Subscribers", value: subscriberCount.toLocaleString("en-IN"), note: "Newsletter", href: "/admin/newsletter/subscribers" },
    { label: "Blog posts", value: published.toLocaleString("en-IN"), note: `${drafts} draft${drafts === 1 ? "" : "s"}`, href: "/admin/blog" },
  ];

  return (
    <>
      <PageHeader title="Overview" description="What's happening across the site." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            <Card className="h-full transition-colors hover:bg-muted/30">
              <CardHeader>
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{s.value}</CardTitle>
                <p className="text-xs text-muted-foreground">{s.note}</p>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming events</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyLine text="No upcoming events." href="/admin/events/new" cta="Create an event" />
            ) : (
              <ul className="divide-y">
                {upcoming.map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/events/${e.id}/participants`} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.title}</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(e.startsAt, e.timezone)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-sm">
                        {e.status === "draft" && <StatusBadge status="draft" />}
                        <span
                          className={
                            e.capacity && e.participants >= e.capacity
                              ? "font-medium text-amber-700 tabular-nums"
                              : "text-muted-foreground tabular-nums"
                          }
                        >
                          {e.participants}
                          {e.capacity ? ` / ${e.capacity}` : ""}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest participants</CardTitle>
          </CardHeader>
          <CardContent>
            {recentParticipants.length === 0 ? (
              <EmptyLine text="Nobody has paid for an event yet." />
            ) : (
              <ul className="divide-y">
                {recentParticipants.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.name}</p>
                      <Link href={`/admin/events/${r.eventId}/participants`} className="truncate text-sm text-muted-foreground hover:text-foreground">
                        {r.eventTitle}
                      </Link>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <p className="tabular-nums">{r.amountPaise === 0 ? "Free" : formatPaise(r.amountPaise)}</p>
                      <p className="text-muted-foreground">{formatDateTime(r.paidAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recently edited posts</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <EmptyLine text="No blog posts yet." href="/admin/blog/new" cta="Write a post" />
            ) : (
              <ul className="divide-y">
                {recentPosts.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/blog/${p.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
                      <span className="truncate font-medium">{p.title}</span>
                      <span className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                        <StatusBadge status={p.status} />
                        <span className="hidden sm:inline">{formatDateTime(p.updatedAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function EmptyLine({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm text-muted-foreground">
      <span>{text}</span>
      {href && cta && (
        <Link href={href} className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
          {cta} <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
