"use client";

import { useState } from "react";
import type { Offer, TicketTier } from "@/db/schema";
import { FormField } from "@/components/admin/form-field";
import { useActionForm } from "@/components/admin/use-action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action-state";
import { toLocalInput } from "@/lib/dates";
import { paiseToRupeesInput } from "@/lib/money";

type Props = {
  offer?: Offer;
  tiers: Pick<TicketTier, "id" | "name">[];
  timezone: string;
  save: (state: ActionState, fd: FormData) => Promise<ActionState>;
};

export function OfferDialog({ trigger, ...props }: Props & { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        {/* Mounted only while open, so every opening starts from a clean form. */}
        <OfferForm {...props} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function OfferForm({ offer, tiers, timezone, save, onDone }: Props & { onDone: () => void }) {
  const [type, setType] = useState(offer?.discountType ?? "percent");
  const { pending, onSubmit, error } = useActionForm(save, { onSuccess: onDone });
  const invalid = (name: string) => !!error(name) || undefined;
  const value = offer
    ? offer.discountType === "flat"
      ? paiseToRupeesInput(offer.discountValue)
      : String(offer.discountValue)
    : "";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="offerId" value={offer?.id ?? ""} />
      <DialogHeader>
        <DialogTitle>{offer ? "Edit offer" : "Add an offer"}</DialogTitle>
        <DialogDescription>
          Without a code the discount applies automatically (e.g. early bird). With a code, buyers type it at
          checkout.
        </DialogDescription>
      </DialogHeader>
      <FormField label="Offer name" htmlFor="offer-title" error={error("title")}>
        <Input id="offer-title" name="title" defaultValue={offer?.title} placeholder="Early bird" aria-invalid={invalid("title")} />
      </FormField>
      <FormField
        label="Description (optional)"
        htmlFor="offer-description"
        error={error("description")}
        description="Shown on the event page when the offer is visible."
      >
        <Textarea id="offer-description" name="description" rows={2} defaultValue={offer?.description ?? ""} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Discount type" htmlFor="offer-type" error={error("discountType")}>
          <NativeSelect
            id="offer-type"
            name="discountType"
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "flat")}
            className="w-full"
          >
            <NativeSelectOption value="percent">Percentage off</NativeSelectOption>
            <NativeSelectOption value="flat">Amount off (₹)</NativeSelectOption>
          </NativeSelect>
        </FormField>
        <FormField label={type === "percent" ? "Discount (%)" : "Discount (₹)"} htmlFor="offer-value" error={error("discountValue")}>
          <Input
            id="offer-value"
            name="discountValue"
            inputMode={type === "percent" ? "numeric" : "decimal"}
            defaultValue={value}
            placeholder={type === "percent" ? "20" : "500"}
            aria-invalid={invalid("discountValue")}
          />
        </FormField>
        <FormField label="Applies to" htmlFor="offer-tier" error={error("tierId")}>
          <NativeSelect id="offer-tier" name="tierId" defaultValue={offer?.tierId ?? ""} className="w-full">
            <NativeSelectOption value="">All ticket types</NativeSelectOption>
            {tiers.map((t) => (
              <NativeSelectOption key={t.id} value={t.id}>
                {t.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Code (optional)" htmlFor="offer-code" error={error("code")} description="Empty = automatic.">
          <Input
            id="offer-code"
            name="code"
            defaultValue={offer?.code ?? ""}
            placeholder="EARLY20"
            className="uppercase"
            aria-invalid={invalid("code")}
          />
        </FormField>
        <FormField label="Starts (optional)" htmlFor="offer-start" error={error("startsAt")}>
          <Input id="offer-start" name="startsAt" type="datetime-local" defaultValue={toLocalInput(offer?.startsAt, timezone)} />
        </FormField>
        <FormField label="Ends (optional)" htmlFor="offer-end" error={error("endsAt")}>
          <Input
            id="offer-end"
            name="endsAt"
            type="datetime-local"
            defaultValue={toLocalInput(offer?.endsAt, timezone)}
            aria-invalid={invalid("endsAt")}
          />
        </FormField>
        <FormField
          label="Use limit (optional)"
          htmlFor="offer-max"
          error={error("maxRedemptions")}
          description="e.g. first 50 buyers."
        >
          <Input
            id="offer-max"
            name="maxRedemptions"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={offer?.maxRedemptions ?? ""}
            aria-invalid={invalid("maxRedemptions")}
          />
        </FormField>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Switch id="offer-show" name="showOnPage" defaultChecked={offer?.showOnPage ?? true} />
          <Label htmlFor="offer-show">Show on the event page</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="offer-active" name="active" defaultChecked={offer?.active ?? true} />
          <Label htmlFor="offer-active">Active</Label>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : offer ? "Save" : "Add offer"}
        </Button>
      </DialogFooter>
    </form>
  );
}
