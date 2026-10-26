"use client";

import { useState } from "react";
import { Upload, UserPlus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { addSubscriber, importSubscribers } from "../actions";

export function AddSubscriberDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <AddSubscriberForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AddSubscriberForm({ onDone }: { onDone: () => void }) {
  const { pending, onSubmit, error } = useActionForm(addSubscriber, { onSuccess: onDone });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Add a subscriber</DialogTitle>
        <DialogDescription>Only add people who asked to get the newsletter.</DialogDescription>
      </DialogHeader>
      <FormField label="Email" htmlFor="email" error={error("email")}>
        <Input id="email" name="email" type="email" autoFocus aria-invalid={!!error("email") || undefined} />
      </FormField>
      <FormField label="Name (optional)" htmlFor="name">
        <Input id="name" name="name" />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add subscriber"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ImportSubscribersDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload /> Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <ImportSubscribersForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ImportSubscribersForm({ onDone }: { onDone: () => void }) {
  const { pending, onSubmit, error } = useActionForm(importSubscribers, { onSuccess: onDone });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Import subscribers</DialogTitle>
        <DialogDescription>
          Paste one person per line, e.g. <code>asha@example.com</code>, <code>asha@example.com, Asha Rao</code> or{" "}
          <code>Asha Rao &lt;asha@example.com&gt;</code>. People already on the list are skipped.
        </DialogDescription>
      </DialogHeader>
      <FormField label="People" htmlFor="list" error={error("list")}>
        <Textarea id="list" name="list" rows={8} className="font-mono text-sm" />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Importing…" : "Import"}
        </Button>
      </DialogFooter>
    </form>
  );
}
