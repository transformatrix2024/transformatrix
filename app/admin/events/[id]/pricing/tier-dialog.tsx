"use client";

import { useState } from "react";
import type { TicketTier } from "@/db/schema";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action-state";
import { toLocalInput } from "@/lib/dates";
import { paiseToRupeesInput } from "@/lib/money";

type Props = {
  tier?: TicketTier;
  timezone: string;
  save: (state: ActionState, fd: FormData) => Promise<ActionState>;
};

export function TierDialog({ trigger, ...props }: Props & { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        {/* Mounted only while open, so every opening starts from a clean form. */}
        <TierForm {...props} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TierForm({ tier, timezone, save, onDone }: Props & { onDone: () => void }) {
  const { pending, onSubmit, error } = useActionForm(save, { onSuccess: onDone });
  const invalid = (name: string) => !!error(name) || undefined;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="tierId" value={tier?.id ?? ""} />
      <DialogHeader>
        <DialogTitle>{tier ? "Edit ticket type" : "Add a ticket type"}</DialogTitle>
        <DialogDescription>For example General, Student or VIP. Use a price of 0 for free tickets.</DialogDescription>
      </DialogHeader>
      <FormField label="Name" htmlFor="tier-name" error={error("name")}>
        <Input id="tier-name" name="name" defaultValue={tier?.name} placeholder="General admission" aria-invalid={invalid("name")} />
      </FormField>
      <FormField label="Description (optional)" htmlFor="tier-description" error={error("description")}>
        <Textarea id="tier-description" name="description" rows={2} defaultValue={tier?.description ?? ""} placeholder="What's included" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Price (₹)" htmlFor="tier-price" error={error("price")}>
          <Input
            id="tier-price"
            name="price"
            inputMode="decimal"
            defaultValue={tier ? paiseToRupeesInput(tier.pricePaise) : ""}
            placeholder="1499"
            aria-invalid={invalid("price")}
          />
        </FormField>
        <FormField label="Tickets available" htmlFor="tier-quantity" error={error("quantity")} description="Empty = no limit.">
          <Input
            id="tier-quantity"
            name="quantity"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={tier?.quantity ?? ""}
            aria-invalid={invalid("quantity")}
          />
        </FormField>
        <FormField label="Sales open (optional)" htmlFor="tier-start" error={error("salesStartAt")}>
          <Input id="tier-start" name="salesStartAt" type="datetime-local" defaultValue={toLocalInput(tier?.salesStartAt, timezone)} />
        </FormField>
        <FormField label="Sales close (optional)" htmlFor="tier-end" error={error("salesEndAt")}>
          <Input
            id="tier-end"
            name="salesEndAt"
            type="datetime-local"
            defaultValue={toLocalInput(tier?.salesEndAt, timezone)}
            aria-invalid={invalid("salesEndAt")}
          />
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="tier-active" name="active" defaultChecked={tier?.active ?? true} />
        <Label htmlFor="tier-active">On sale</Label>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : tier ? "Save" : "Add ticket type"}
        </Button>
      </DialogFooter>
    </form>
  );
}
