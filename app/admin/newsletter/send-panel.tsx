"use client";

import { Send } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { FormField } from "@/components/admin/form-field";
import { useActionForm } from "@/components/admin/use-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/action-state";

export function SendPanel({
  audience,
  resume,
  lastError,
  emailReady,
  sendTest,
  sendAll,
}: {
  audience: number;
  resume: boolean;
  lastError: string | null;
  emailReady: boolean;
  sendTest: (state: ActionState, fd: FormData) => Promise<ActionState>;
  sendAll: () => Promise<ActionState>;
}) {
  const test = useActionForm(sendTest);
  const people = `${audience.toLocaleString("en-IN")} subscriber${audience === 1 ? "" : "s"}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send</CardTitle>
        <CardDescription>Sends the last saved version. Save your changes first.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!emailReady && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Sending isn&apos;t set up yet. Add <code>RESEND_API_KEY</code> and{" "}
            <code>NEWSLETTER_FROM_EMAIL</code> in Vercel, then redeploy.
          </p>
        )}
        {lastError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Last attempt failed: {lastError}</p>
        )}

        <form onSubmit={test.onSubmit} className="flex flex-col gap-2">
          <FormField label="Send a test to" htmlFor="testEmail" error={test.error("testEmail")}>
            <div className="flex gap-2">
              <Input id="testEmail" name="testEmail" type="email" placeholder="you@example.com" />
              <Button type="submit" variant="outline" disabled={test.pending || !emailReady}>
                {test.pending ? "Sending…" : "Send test"}
              </Button>
            </div>
          </FormField>
        </form>

        <ConfirmAction
          trigger={
            <Button disabled={!emailReady || audience === 0} className="w-full">
              <Send /> {resume ? "Resume sending" : `Send to ${people}`}
            </Button>
          }
          title={resume ? "Resume sending?" : `Send to ${people}?`}
          description={
            resume
              ? "It continues with everyone who hasn't received this issue yet."
              : "This can't be undone. Each subscriber gets one email with an unsubscribe link."
          }
          confirmLabel={resume ? "Resume" : "Send now"}
          action={sendAll}
        />
        {audience === 0 && (
          <p className="text-sm text-muted-foreground">Add subscribers before sending.</p>
        )}
      </CardContent>
    </Card>
  );
}
