import { notFound } from "next/navigation";
import { and, asc, count, eq, isNotNull } from "drizzle-orm";
import { Pencil, Plus, Tag, Ticket, Trash2 } from "lucide-react";
import { db } from "@/db";
import { offers, registrations, ticketTiers, type Offer, type TicketTier } from "@/db/schema";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { FlashToast } from "@/components/admin/flash-toast";
import { Pill } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import { getEvent } from "@/lib/events";
import { formatPaise } from "@/lib/money";
import { bestAutomaticOffer, describeDiscount } from "@/lib/pricing";
import { deleteOffer, deleteTier, saveOffer, saveTier } from "../../actions";
import { OfferDialog } from "./offer-dialog";
import { TierDialog } from "./tier-dialog";

export const metadata = { title: "Pricing & offers" };

export default async function PricingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const event = await getEvent((await params).id);
  if (!event) notFound();

  const [tiers, sold, eventOffers, used] = await Promise.all([
    db().select().from(ticketTiers).where(eq(ticketTiers.eventId, event.id)).orderBy(asc(ticketTiers.pricePaise), asc(ticketTiers.createdAt)),
    db()
      .select({ tierId: registrations.tierId, n: count() })
      .from(registrations)
      .where(and(eq(registrations.eventId, event.id), eq(registrations.status, "paid")))
      .groupBy(registrations.tierId),
    db().select().from(offers).where(eq(offers.eventId, event.id)).orderBy(asc(offers.createdAt)),
    db()
      .select({ offerId: registrations.offerId, n: count() })
      .from(registrations)
      .where(and(eq(registrations.eventId, event.id), eq(registrations.status, "paid"), isNotNull(registrations.offerId)))
      .groupBy(registrations.offerId),
  ]);
  const soldBy = new Map(sold.map((r) => [r.tierId, r.n]));
  const usedBy = new Map(used.map((r) => [r.offerId!, r.n]));
  const tierName = new Map(tiers.map((t) => [t.id, t.name]));
  const tz = event.timezone;
  const now = new Date();

  const save = saveTier.bind(null, event.id);
  const saveOfferAction = saveOffer.bind(null, event.id);

  return (
    <div className="flex flex-col gap-6">
      <FlashToast message="Event created. Now add ticket prices." />

      <Card>
        <CardHeader>
          <CardTitle>Ticket types</CardTitle>
          <CardDescription>What people can buy and for how much. Prices are in rupees, paid through Razorpay.</CardDescription>
          <CardAction>
            <TierDialog
              trigger={
                <Button>
                  <Plus /> Add ticket type
                </Button>
              }
              timezone={tz}
              save={save}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          {tiers.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Ticket />
                </EmptyMedia>
                <EmptyTitle>No ticket types yet</EmptyTitle>
                <EmptyDescription>Add at least one so people can register, e.g. General ₹999.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="hidden md:table-cell">Sales window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier) => {
                  const soldCount = soldBy.get(tier.id) ?? 0;
                  return (
                    <TableRow key={tier.id}>
                      <TableCell className="w-full max-w-0 min-w-32">
                        <p className="truncate font-medium">{tier.name}</p>
                        {tier.description && <p className="truncate text-xs text-muted-foreground">{tier.description}</p>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{tier.pricePaise === 0 ? "Free" : formatPaise(tier.pricePaise)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {soldCount}
                        <span className="text-muted-foreground"> / {tier.quantity ?? "∞"}</span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {dateWindow(tier.salesStartAt, tier.salesEndAt, tz)}
                      </TableCell>
                      <TableCell>
                        <TierStatus tier={tier} sold={soldCount} now={now} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <TierDialog
                            trigger={
                              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${tier.name}`}>
                                <Pencil />
                              </Button>
                            }
                            tier={tier}
                            timezone={tz}
                            save={save}
                          />
                          <ConfirmAction
                            trigger={
                              <Button variant="ghost" size="icon-sm" aria-label={`Delete ${tier.name}`}>
                                <Trash2 />
                              </Button>
                            }
                            title={`Delete “${tier.name}”?`}
                            description="Offers that only apply to this ticket type are deleted too. If anyone has bought it, turn off “On sale” instead."
                            confirmLabel="Delete"
                            destructive
                            action={deleteTier.bind(null, event.id, tier.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Offers</CardTitle>
          <CardDescription>Early-bird discounts, promo codes and limited deals.</CardDescription>
          <CardAction>
            <OfferDialog
              trigger={
                <Button variant="outline">
                  <Plus /> Add offer
                </Button>
              }
              tiers={tiers}
              timezone={tz}
              save={saveOfferAction}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          {eventOffers.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Tag />
                </EmptyMedia>
                <EmptyTitle>No offers</EmptyTitle>
                <EmptyDescription>e.g. “Early bird: 20% off until 30 Nov” or a code like STUDENT50.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offer</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead className="hidden sm:table-cell">How</TableHead>
                  <TableHead className="hidden lg:table-cell">Valid</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventOffers.map((offer) => {
                  const usedCount = usedBy.get(offer.id) ?? 0;
                  return (
                    <TableRow key={offer.id}>
                      <TableCell className="w-full max-w-0 min-w-32">
                        <p className="truncate font-medium">{offer.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {offer.tierId ? (tierName.get(offer.tierId) ?? "—") : "All ticket types"}
                          {!offer.showOnPage && " · hidden from page"}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{describeDiscount(offer, formatPaise)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {offer.code ? <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{offer.code}</code> : <span className="text-muted-foreground">Automatic</span>}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{dateWindow(offer.startsAt, offer.endsAt, tz)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {usedCount}
                        {offer.maxRedemptions ? <span className="text-muted-foreground"> / {offer.maxRedemptions}</span> : null}
                      </TableCell>
                      <TableCell>
                        <OfferStatus offer={offer} used={usedCount} now={now} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <OfferDialog
                            trigger={
                              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${offer.title}`}>
                                <Pencil />
                              </Button>
                            }
                            offer={offer}
                            tiers={tiers}
                            timezone={tz}
                            save={saveOfferAction}
                          />
                          <ConfirmAction
                            trigger={
                              <Button variant="ghost" size="icon-sm" aria-label={`Delete ${offer.title}`}>
                                <Trash2 />
                              </Button>
                            }
                            title={`Delete “${offer.title}”?`}
                            description="People who already used it keep their price. To pause it instead, edit it and turn off Active."
                            confirmLabel="Delete"
                            destructive
                            action={deleteOffer.bind(null, event.id, offer.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {tiers.some((t) => t.active) && (
        <Card>
          <CardHeader>
            <CardTitle>What buyers see right now</CardTitle>
            <CardDescription>Prices with the best automatic offer applied. Codes are applied at checkout.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tiers
                .filter((t) => t.active)
                .map((tier) => {
                  const best = bestAutomaticOffer(tier, eventOffers, usedBy, now);
                  return (
                    <li key={tier.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{tier.name}</p>
                        <TierStatus tier={tier} sold={soldBy.get(tier.id) ?? 0} now={now} />
                      </div>
                      <p className="mt-2 text-2xl font-semibold tabular-nums">
                        {tier.pricePaise === 0 ? "Free" : formatPaise(tier.pricePaise - (best?.off ?? 0))}
                        {best && best.off > 0 && (
                          <span className="ml-2 text-base font-normal text-muted-foreground line-through">
                            {formatPaise(tier.pricePaise)}
                          </span>
                        )}
                      </p>
                      {best && best.off > 0 && (
                        <p className="mt-1 text-sm text-emerald-700">
                          {best.offer.title}: {describeDiscount(best.offer, formatPaise)}
                          {best.offer.endsAt && ` until ${formatDateTime(best.offer.endsAt, tz)}`}
                        </p>
                      )}
                    </li>
                  );
                })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function dateWindow(start: Date | null, end: Date | null, tz: string) {
  if (start && end) return `${formatDateTime(start, tz)} – ${formatDateTime(end, tz)}`;
  if (start) return `From ${formatDateTime(start, tz)}`;
  if (end) return `Until ${formatDateTime(end, tz)}`;
  return "Always";
}

function TierStatus({ tier, sold, now }: { tier: TicketTier; sold: number; now: Date }) {
  if (!tier.active) return <Pill>Off sale</Pill>;
  if (tier.quantity !== null && sold >= tier.quantity) return <Pill tone="amber">Sold out</Pill>;
  if (tier.salesStartAt && tier.salesStartAt > now) return <Pill tone="blue">Opens later</Pill>;
  if (tier.salesEndAt && tier.salesEndAt <= now) return <Pill>Sales ended</Pill>;
  return <Pill tone="green">On sale</Pill>;
}

function OfferStatus({ offer, used, now }: { offer: Offer; used: number; now: Date }) {
  if (!offer.active) return <Pill>Off</Pill>;
  if (offer.endsAt && offer.endsAt <= now) return <Pill>Ended</Pill>;
  if (offer.startsAt && offer.startsAt > now) return <Pill tone="blue">Scheduled</Pill>;
  if (offer.maxRedemptions !== null && used >= offer.maxRedemptions) return <Pill tone="amber">Used up</Pill>;
  return <Pill tone="green">Live</Pill>;
}
