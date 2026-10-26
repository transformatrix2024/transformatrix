import Link from "next/link";
import { asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { CalendarDays, Plus } from "lucide-react";
import { db } from "@/db";
import { events, registrations } from "@/db/schema";
import { LinkTabs } from "@/components/admin/link-tabs";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import { eventPlace } from "@/lib/events";
import { formatPaise } from "@/lib/money";

export const metadata = { title: "Events" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireAdmin();
  const past = (await searchParams).view === "past";
  // An event counts as upcoming until it ends (or starts, if no end is set).
  const endsAt = sql`coalesce(${events.endsAt}, ${events.startsAt})`;
  // Raw SQL has no column type to convert a Date with, so pass ISO text.
  const now = new Date().toISOString();

  const rows = await db()
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      startsAt: events.startsAt,
      timezone: events.timezone,
      venueName: events.venueName,
      onlineUrl: events.onlineUrl,
      capacity: events.capacity,
      participants: sql<number>`count(${registrations.id}) filter (where ${registrations.status} = 'paid')`.mapWith(Number),
      revenue: sql<number>`coalesce(sum(${registrations.amountPaise} - ${registrations.refundedPaise}) filter (where ${registrations.status} = 'paid'), 0)`.mapWith(Number),
    })
    .from(events)
    .leftJoin(registrations, eq(registrations.eventId, events.id))
    .where(past ? lt(endsAt, now) : gte(endsAt, now))
    .groupBy(events.id)
    .orderBy(past ? desc(events.startsAt) : asc(events.startsAt));

  return (
    <>
      <PageHeader
        title="Events"
        description="Create events, set ticket prices and offers, and manage participants."
        actions={
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus /> New event
            </Link>
          </Button>
        }
      />
      <LinkTabs
        className="mb-4"
        tabs={[
          { href: "/admin/events", label: "Upcoming" },
          { href: "/admin/events?view=past", label: "Past" },
        ]}
      />

      {rows.length === 0 ? (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDays />
              </EmptyMedia>
              <EmptyTitle>{past ? "No past events" : "No upcoming events"}</EmptyTitle>
              <EmptyDescription>
                {past ? "Events move here once they're over." : "Create an event to start selling tickets."}
              </EmptyDescription>
            </EmptyHeader>
            {!past && (
              <EmptyContent>
                <Button asChild>
                  <Link href="/admin/events/new">Create an event</Link>
                </Button>
              </EmptyContent>
            )}
          </Empty>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Event</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Participants</TableHead>
                <TableHead className="hidden pr-4 text-right sm:table-cell">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="w-full max-w-0 pl-4">
                    <Link href={`/admin/events/${e.id}/participants`} className="block truncate font-medium hover:underline">
                      {e.title}
                    </Link>
                    <span className="block truncate text-xs text-muted-foreground">
                      <span className="md:hidden">{formatDateTime(e.startsAt, e.timezone)} · </span>
                      {eventPlace(e) ?? "No venue yet"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDateTime(e.startsAt, e.timezone)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${e.capacity && e.participants >= e.capacity ? "font-medium text-amber-700" : ""}`}
                  >
                    {e.participants.toLocaleString("en-IN")}
                    {e.capacity ? <span className="opacity-70"> / {e.capacity}</span> : null}
                  </TableCell>
                  <TableCell className="hidden pr-4 text-right tabular-nums sm:table-cell">{formatPaise(e.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
