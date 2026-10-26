import type { Offer, TicketTier } from "@/db/schema";

type Discount = Pick<Offer, "discountType" | "discountValue">;

// Percentage discounts are rounded to whole rupees so buyers see clean
// prices (20% off ₹999 is ₹799, not ₹799.20).
export function discountPaise(pricePaise: number, offer: Discount) {
  const off =
    offer.discountType === "percent"
      ? Math.round((pricePaise * offer.discountValue) / 100 / 100) * 100
      : offer.discountValue;
  return Math.min(off, pricePaise);
}

export function describeDiscount(offer: Discount, format: (paise: number) => string) {
  return offer.discountType === "percent"
    ? `${offer.discountValue}% off`
    : `${format(offer.discountValue)} off`;
}

export function isOfferLive(offer: Offer, now = new Date()) {
  return (
    offer.active &&
    (!offer.startsAt || offer.startsAt <= now) &&
    (!offer.endsAt || offer.endsAt > now)
  );
}

export function offerAppliesTo(offer: Offer, tier: TicketTier) {
  return !offer.tierId || offer.tierId === tier.id;
}

// The automatic offer (no code needed) that gives a tier its biggest discount
// right now, skipping offers that have run out of redemptions.
export function bestAutomaticOffer(
  tier: TicketTier,
  offers: Offer[],
  redemptions: Map<string, number>,
  now = new Date(),
) {
  let best: { offer: Offer; off: number } | null = null;
  for (const offer of offers) {
    if (offer.code || !isOfferLive(offer, now) || !offerAppliesTo(offer, tier)) continue;
    if (offer.maxRedemptions !== null && (redemptions.get(offer.id) ?? 0) >= offer.maxRedemptions) {
      continue;
    }
    const off = discountPaise(tier.pricePaise, offer);
    if (!best || off > best.off) best = { offer, off };
  }
  return best;
}
