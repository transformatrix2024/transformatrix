"use client";

import type { Campaign } from "@/db/schema";
import { FormField } from "@/components/admin/form-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { useActionForm } from "@/components/admin/use-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { saveCampaign } from "./actions";

export function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const { pending, onSubmit, error } = useActionForm(saveCampaign);

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="id" value={campaign?.id ?? ""} />
      <Card>
        <CardContent className="flex flex-col gap-5">
          <FormField label="Subject line" htmlFor="subject" error={error("subject")}>
            <Input
              id="subject"
              name="subject"
              defaultValue={campaign?.subject}
              placeholder="What's this issue about?"
              aria-invalid={!!error("subject") || undefined}
            />
          </FormField>
          <FormField
            label="Preview text"
            htmlFor="previewText"
            error={error("previewText")}
            description="Shown next to the subject in most inboxes."
          >
            <Input id="previewText" name="previewText" defaultValue={campaign?.previewText ?? ""} />
          </FormField>
          <FormField label="Email content" htmlFor="contentMd" error={error("contentMd")}>
            <MarkdownEditor
              id="contentMd"
              name="contentMd"
              defaultValue={campaign?.contentMd}
              rows={18}
              placeholder="Write the newsletter in Markdown…"
            />
          </FormField>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : campaign ? "Save changes" : "Save draft"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
