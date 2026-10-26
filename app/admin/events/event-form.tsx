"use client";

import { useState } from "react";
import type { Event } from "@/db/schema";
import { FormField } from "@/components/admin/form-field";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { useActionForm } from "@/components/admin/use-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_TIMEZONE, TIMEZONES, toLocalInput } from "@/lib/dates";
import { slugify } from "@/lib/slug";
import { saveEvent } from "./actions";

export function EventForm({ event, uploadsEnabled }: { event?: Event; uploadsEnabled: boolean }) {
  const { pending, onSubmit, error } = useActionForm(saveEvent);
  const [title, setTitle] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(event));
  const tz = event?.timezone ?? DEFAULT_TIMEZONE;
  const invalid = (name: string) => !!error(name) || undefined;

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <input type="hidden" name="id" value={event?.id ?? ""} />

      <Card>
        <CardContent className="flex flex-col gap-5">
          <FormField label="Event name" htmlFor="title" error={error("title")}>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={invalid("title")}
              className="text-base"
            />
          </FormField>
          <FormField label="URL" htmlFor="slug" error={error("slug")}>
            <div className="flex items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="pl-2.5 text-sm text-muted-foreground">/events/</span>
              <input
                id="slug"
                name="slug"
                value={slugEdited ? slug : slugify(title)}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                aria-invalid={invalid("slug")}
                className="h-8 min-w-0 flex-1 bg-transparent pr-2.5 text-sm outline-none"
              />
            </div>
          </FormField>
          <FormField
            label="Short summary"
            htmlFor="summary"
            error={error("summary")}
            description="One line shown on event cards and link previews."
          >
            <Textarea id="summary" name="summary" rows={2} defaultValue={event?.summary ?? ""} />
          </FormField>
          <FormField label="Description" htmlFor="descriptionMd" error={error("descriptionMd")}>
            <MarkdownEditor
              id="descriptionMd"
              name="descriptionMd"
              defaultValue={event?.descriptionMd}
              rows={14}
              placeholder="Agenda, speakers, who it's for…"
            />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              label="Visibility"
              htmlFor="status"
              error={error("status")}
              description="Drafts aren't shown on the website."
            >
              <NativeSelect id="status" name="status" defaultValue={event?.status ?? "draft"} className="w-full">
                <NativeSelectOption value="draft">Draft</NativeSelectOption>
                <NativeSelectOption value="published">Published</NativeSelectOption>
                <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
              </NativeSelect>
            </FormField>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : event ? "Save changes" : "Create event"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>When</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField label="Starts" htmlFor="startsAt" error={error("startsAt")}>
              <Input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={toLocalInput(event?.startsAt, tz)}
                aria-invalid={invalid("startsAt")}
              />
            </FormField>
            <FormField label="Ends (optional)" htmlFor="endsAt" error={error("endsAt")}>
              <Input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={toLocalInput(event?.endsAt, tz)}
                aria-invalid={invalid("endsAt")}
              />
            </FormField>
            <FormField label="Timezone" htmlFor="timezone" error={error("timezone")}>
              <NativeSelect id="timezone" name="timezone" defaultValue={tz} className="w-full">
                {TIMEZONES.map((t) => (
                  <NativeSelectOption key={t.value} value={t.value}>
                    {t.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField label="Venue name" htmlFor="venueName" error={error("venueName")}>
              <Input id="venueName" name="venueName" defaultValue={event?.venueName ?? ""} />
            </FormField>
            <FormField label="Address" htmlFor="venueAddress" error={error("venueAddress")}>
              <Textarea id="venueAddress" name="venueAddress" rows={2} defaultValue={event?.venueAddress ?? ""} />
            </FormField>
            <FormField
              label="Online link"
              htmlFor="onlineUrl"
              error={error("onlineUrl")}
              description="Zoom, Meet or stream link, for online or hybrid events."
            >
              <Input
                id="onlineUrl"
                name="onlineUrl"
                type="url"
                defaultValue={event?.onlineUrl ?? ""}
                aria-invalid={invalid("onlineUrl")}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              label="Maximum participants"
              htmlFor="capacity"
              error={error("capacity")}
              description="Leave empty for no limit. Ticket types can have their own limits too."
            >
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                inputMode="numeric"
                defaultValue={event?.capacity ?? ""}
                aria-invalid={invalid("capacity")}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover image</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField label="Image" htmlFor="coverImageUrl" error={error("coverImageUrl")} className="[&>label]:sr-only">
              <ImageField
                id="coverImageUrl"
                name="coverImageUrl"
                defaultValue={event?.coverImageUrl}
                folder="events"
                uploadsEnabled={uploadsEnabled}
                invalid={!!error("coverImageUrl")}
              />
            </FormField>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
