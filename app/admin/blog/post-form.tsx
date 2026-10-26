"use client";

import { useState } from "react";
import type { Post } from "@/db/schema";
import { FormField } from "@/components/admin/form-field";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { StatusBadge } from "@/components/admin/status-badge";
import { useActionForm } from "@/components/admin/use-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slug";
import { savePost } from "./actions";

export function PostForm({ post, uploadsEnabled }: { post?: Post; uploadsEnabled: boolean }) {
  const { pending, onSubmit, error } = useActionForm(savePost);
  const [title, setTitle] = useState(post?.title ?? "");
  // The slug follows the title until someone edits it by hand.
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const shownSlug = slugEdited ? slug : slugify(title);
  const published = post?.status === "published";

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="id" value={post?.id ?? ""} />

      <Card>
        <CardContent className="flex flex-col gap-5">
          <FormField label="Title" htmlFor="title" error={error("title")}>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the post about?"
              aria-invalid={!!error("title") || undefined}
              className="text-base"
            />
          </FormField>
          <FormField
            label="URL"
            htmlFor="slug"
            error={error("slug")}
            description="Lowercase words joined by dashes. Changing it after publishing breaks old links."
          >
            <div className="flex items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="pl-2.5 text-sm text-muted-foreground">/blog/</span>
              <input
                id="slug"
                name="slug"
                value={shownSlug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                aria-invalid={!!error("slug") || undefined}
                className="h-8 min-w-0 flex-1 bg-transparent pr-2.5 text-sm outline-none"
              />
            </div>
          </FormField>
          <FormField
            label="Excerpt"
            htmlFor="excerpt"
            error={error("excerpt")}
            description="One or two sentences shown in the blog list and link previews."
          >
            <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} />
          </FormField>
          <FormField label="Content" htmlFor="contentMd" error={error("contentMd")}>
            <MarkdownEditor
              id="contentMd"
              name="contentMd"
              defaultValue={post?.contentMd}
              invalid={!!error("contentMd")}
              placeholder="Write in Markdown…"
            />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Status <StatusBadge status={post?.status ?? "draft"} />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {published ? (
              <>
                <Button type="submit" name="intent" value="save" disabled={pending}>
                  {pending ? "Saving…" : "Save changes"}
                </Button>
                <Button type="submit" name="intent" value="unpublish" variant="outline" disabled={pending}>
                  Unpublish
                </Button>
              </>
            ) : (
              <>
                <Button type="submit" name="intent" value="publish" disabled={pending}>
                  {pending ? "Saving…" : "Publish"}
                </Button>
                <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
                  Save draft
                </Button>
              </>
            )}
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
                defaultValue={post?.coverImageUrl}
                folder="posts"
                uploadsEnabled={uploadsEnabled}
                invalid={!!error("coverImageUrl")}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField label="Author" htmlFor="author" error={error("author")}>
              <Input id="author" name="author" defaultValue={post?.author ?? ""} />
            </FormField>
            <FormField label="Tags" htmlFor="tags" error={error("tags")} description="Separate with commas.">
              <Input id="tags" name="tags" defaultValue={post?.tags.join(", ") ?? ""} placeholder="leadership, events" />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search engines</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField label="SEO title" htmlFor="metaTitle" error={error("metaTitle")} description="Defaults to the post title.">
              <Input id="metaTitle" name="metaTitle" defaultValue={post?.metaTitle ?? ""} />
            </FormField>
            <FormField
              label="SEO description"
              htmlFor="metaDescription"
              error={error("metaDescription")}
              description="Defaults to the excerpt."
            >
              <Textarea id="metaDescription" name="metaDescription" rows={3} defaultValue={post?.metaDescription ?? ""} />
            </FormField>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
