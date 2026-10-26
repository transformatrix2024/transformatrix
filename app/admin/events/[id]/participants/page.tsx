import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { Check, Download, ExternalLink, MonitorPlay, RefreshCw, Users, X } from "lucide-react";
import { db } from "@/db";
import { registrations, ticketTiers, type Registration } from "@/db/schema";
import { ActionButton } from "@/components/admin/action-button";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { LinkTabs } from "@/components/admin/link-tabs";
import { Pill, StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import { getEvent } from "@/lib/events";
import { formatPaise } from "@/lib/money";
import { paymentDashboardUrl, razorpayConfigured } from "@/lib/razorpay";
import { addParticipant, cancelRegistration, syncRazorpay, toggleCheckIn } from "../../actions";
import { ParticipantDialog } from "./participant-dialog";

export const metadata = { title: "Participants" };

const VIEWS = {
  participants: ["paid"],
  pending: ["pending"],
  failed: ["failed"],
  closed: ["refunded", "cancelled"],
} as const;
type View = keyof typeof VIEWS;

const SOURCE_LABEL: Record<Registration["source"], string> = {
  razorpay: "Razorpay",
  offline: "Paid offline",
  complimentary: "Complimentary",
  free: "Free ticket",
};

export default async function ParticipantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const event = await getEvent((await params).id);
  if (!event) notFound();
  const requested = (await searchParams).view;
  const view: View = requested && requested in VIEWS ? (requested as View) : "participants";

  const [rows, counts, [totals], tiers] = await Promise.all([
    db()
      .select({ registration: registrations, tierName: ticketTiers.name })
      .from(registrations)
      .leftJoin(ticketTiers, eq(ticketTiers.id, registrations.tierId))
      .where(and(eq(registrations.eventId, event.id), inArray(registrations.status, [...VIEWS[view]])))
      .orderBy(view === "participants" ? desc(registrations.paidAt) : desc(registrations.createdAt)),
    db()
      .select({ status: registrations.status, n: count() })
      .from(registrations)
      .where(eq(registrations.eventId, event.id))
      .groupBy(registrations.status),
    db()
      .select({
        checkedIn: sql<number>`count(*) filter (where ${registrations.checkedInAt} is not null)`.mapWith(Number),
        revenue: sql<number>`coalesce(sum(${registrations.amountPaise} - ${registrations.refundedPaise}), 0)`.mapWith(Number),
      })
      .from(registrations)
      .where(and(eq(registrations.eventId, event.id), eq(registrations.status, "paid"))),
    db()
      .select({ id: ticketTiers.id, name: ticketTiers.name, pricePaise: ticketTiers.pricePaise })
      .from(ticketTiers)
      .where(eq(ticketTiers.eventId, event.id))
      .orderBy(asc(ticketTiers.pricePaise)),
  ]);
  const n = (...statuses: string[]) => counts.filter((c) => statuses.includes(c.status)).reduce((sum, c) => sum + c.n, 0);
  const paid = n("paid");
  const base = `/admin/events/${event.id}/participants`;

  const stats = [
    { label: "Participants", value: `${paid}${event.capacity ? ` / ${event.capacity}` : ""}`, note: "Paid and confirmed" },
    { label: "Checked in", value: String(totals.checkedIn), note: paid ? `${Math.round((totals.checkedIn / paid) * 100)}% of participants` : "At the door" },
    { label: "Revenue", value: formatPaise(totals.revenue), note: "After refunds" },
    { label: "Awaiting payment", value: String(n("pending")), note: "Started checkout, not paid" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{s.value}</CardTitle>
              <p className="text-xs text-muted-foreground">{s.note}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LinkTabs
          tabs={[
            { href: base, label: `Participants (${paid})` },
            { href: `${base}?view=pending`, label: `Awaiting payment (${n("pending")})` },
            { href: `${base}?view=failed`, label: `Payment failed (${n("failed")})` },
            { href: `${base}?view=closed`, label: `Refunded & cancelled (${n("refunded", "cancelled")})` },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          {razorpayConfigured() && (
            <ActionButton variant="outline" action={syncRazorpay.bind(null, event.id)}>
              <RefreshCw /> Sync with Razorpay
            </ActionButton>
          )}
          <Button variant="outline" asChild>
            <a href={`${base}/export`}>
              <Download /> Export CSV
            </a>
          </Button>
          <ParticipantDialog tiers={tiers} add={addParticipant.bind(null, event.id)} />
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>{EMPTY[view].title}</EmptyTitle>
              <EmptyDescription>{EMPTY[view].description}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Person</TableHead>
                <TableHead className="hidden md:table-cell">Ticket</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden lg:table-cell">{view === "participants" ? "Paid on" : view === "closed" ? "Status" : "Started"}</TableHead>
                {view === "participants" && <TableHead>Check-in</TableHead>}
                <TableHead className="pr-4">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ registration: r, tierName }) => (
                <TableRow key={r.id}>
                  <TableCell className="w-full max-w-0 min-w-40 pl-4">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.email}
                      {r.phone && ` · ${r.phone}`}
                    </p>
                    {r.notes && <p className="truncate text-xs text-muted-foreground italic">{r.notes}</p>}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{tierName ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <p className="tabular-nums">{r.amountPaise === 0 ? "Free" : formatPaise(r.amountPaise)}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.refundedPaise > 0 && r.status === "paid"
                        ? `${formatPaise(r.refundedPaise)} refunded`
                        : SOURCE_LABEL[r.source]}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {view === "closed" ? (
                      <span className="flex flex-col items-start gap-1">
                        <StatusBadge status={r.status} />
                        <span className="text-xs">{formatDateTime(r.refundedAt ?? r.cancelledAt)}</span>
                      </span>
                    ) : (
                      formatDateTime(view === "participants" ? r.paidAt : r.createdAt)
                    )}
                  </TableCell>
                  {view === "participants" && (
                    <TableCell>
                      <ActionButton
                        variant={r.checkedInAt ? "secondary" : "outline"}
                        size="sm"
                        action={toggleCheckIn.bind(null, event.id, r.id)}
                        aria-label={r.checkedInAt ? `Undo check-in for ${r.name}` : `Check in ${r.name}`}
                      >
                        {r.checkedInAt ? (
                          <>
                            <Check /> In
                          </>
                        ) : (
                          "Check in"
                        )}
                      </ActionButton>
                    </TableCell>
                  )}
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/admin/recordings?person=${encodeURIComponent(r.email)}`} aria-label={`Session recordings of ${r.name}`}>
                              <MonitorPlay />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Session recordings</TooltipContent>
                      </Tooltip>
                      {r.source === "razorpay" && r.razorpayPaymentId ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" asChild>
                              <a href={paymentDashboardUrl(r.razorpayPaymentId)} target="_blank" rel="noreferrer" aria-label="Open payment in Razorpay">
                                <ExternalLink />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{r.status === "paid" ? "Refund or view in Razorpay" : "View in Razorpay"}</TooltipContent>
                        </Tooltip>
                      ) : null}
                      {(r.status === "pending" || r.status === "failed" || (r.status === "paid" && r.source !== "razorpay")) && (
                        <ConfirmAction
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label={`Cancel ${r.name}`}>
                              <X />
                            </Button>
                          }
                          title={r.status === "paid" ? `Remove ${r.name}?` : `Cancel ${r.name}'s order?`}
                          description={
                            r.status === "paid"
                              ? "They stop being a participant. Return any offline payment yourself."
                              : "The unpaid order is closed. If they pay later anyway, they're added back automatically."
                          }
                          confirmLabel={r.status === "paid" ? "Remove" : "Cancel order"}
                          destructive
                          action={cancelRegistration.bind(null, event.id, r.id)}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {view !== "participants" && (
        <p className="text-sm text-muted-foreground">
          <Pill tone="amber" className="mr-1">Not participants</Pill> People here haven&apos;t paid. They move to
          Participants as soon as Razorpay confirms their payment.
        </p>
      )}
    </div>
  );
}

const EMPTY: Record<View, { title: string; description: string }> = {
  participants: {
    title: "No participants yet",
    description: "People appear here once Razorpay confirms their payment, or when you add them yourself.",
  },
  pending: { title: "No unpaid orders", description: "People who start checkout but haven't paid show up here." },
  failed: { title: "No failed payments", description: "Payments that fail at Razorpay show up here." },
  closed: { title: "Nothing refunded or cancelled", description: "Refunds made in Razorpay and cancelled orders show up here." },
};
