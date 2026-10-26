"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action-state";
import { paiseToRupeesInput } from "@/lib/money";

type Props = {
  tiers: Pick<TicketTier, "id" | "name" | "pricePaise">[];
  add: (state: ActionState, fd: FormData) => Promise<ActionState>;
};

export function ParticipantDialog(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus /> Add participant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        {/* Mounted only while open, so every opening starts from a clean form. */}
        <ParticipantForm {...props} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ParticipantForm({ tiers, add, onDone }: Props & { onDone: () => void }) {
  const [source, setSource] = useState<"offline" | "complimentary">("offline");
  const [tierId, setTierId] = useState(tiers[0]?.id ?? "");
  const [amount, setAmount] = useState(tiers[0] ? paiseToRupeesInput(tiers[0].pricePaise) : "");
  const { pending, onSubmit, error } = useActionForm(add, { onSuccess: onDone });
  const invalid = (name: string) => !!error(name) || undefined;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Add a participant</DialogTitle>
        <DialogDescription>
          For people who paid outside Razorpay (cash, UPI, bank transfer) or get a free pass. Online payments are
          added automatically.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" htmlFor="p-name" error={error("name")} className="sm:col-span-2">
          <Input id="p-name" name="name" aria-invalid={invalid("name")} />
        </FormField>
        <FormField label="Email" htmlFor="p-email" error={error("email")}>
          <Input id="p-email" name="email" type="email" aria-invalid={invalid("email")} />
        </FormField>
        <FormField label="Phone (optional)" htmlFor="p-phone" error={error("phone")}>
          <Input id="p-phone" name="phone" type="tel" aria-invalid={invalid("phone")} />
        </FormField>
        <FormField label="Ticket" htmlFor="p-tier" error={error("tierId")}>
          <NativeSelect
            id="p-tier"
            name="tierId"
            value={tierId}
            onChange={(e) => {
              setTierId(e.target.value);
              const tier = tiers.find((t) => t.id === e.target.value);
              if (tier) setAmount(paiseToRupeesInput(tier.pricePaise));
            }}
            className="w-full"
          >
            {tiers.map((t) => (
              <NativeSelectOption key={t.id} value={t.id}>
                {t.name}
              </NativeSelectOption>
            ))}
            <NativeSelectOption value="">No ticket type</NativeSelectOption>
          </NativeSelect>
        </FormField>
        <FormField label="Payment" htmlFor="p-source" error={error("source")}>
          <NativeSelect
            id="p-source"
            name="source"
            value={source}
            onChange={(e) => setSource(e.target.value as "offline" | "complimentary")}
            className="w-full"
          >
            <NativeSelectOption value="offline">Paid offline</NativeSelectOption>
            <NativeSelectOption value="complimentary">Complimentary (free pass)</NativeSelectOption>
          </NativeSelect>
        </FormField>
        {source === "offline" && (
          <FormField label="Amount paid (₹)" htmlFor="p-amount" error={error("amount")}>
            <Input
              id="p-amount"
              name="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={invalid("amount")}
            />
          </FormField>
        )}
        <FormField label="Note (optional)" htmlFor="p-notes" error={error("notes")} className="sm:col-span-2">
          <Textarea id="p-notes" name="notes" rows={2} placeholder="e.g. Paid by UPI, ref 1234" />
        </FormField>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add participant"}
        </Button>
      </DialogFooter>
    </form>
  );
}
