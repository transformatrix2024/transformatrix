"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import {
  fail,
  invalid,
  isUniqueViolation,
  optionalText,
  text,
  type ActionState,
} from "@/lib/action-state";
import { isUuid } from "@/lib/ids";
import { isSlug, slugify } from "@/lib/slug";

const PostInput = z.object({
  title: z.string().min(1, "Give the post a title.").max(200),
  slug: z
    .string()
    .min(1, "Add a URL slug.")
    .max(80)
    .refine(isSlug, "Use lowercase letters, numbers and dashes only."),
  excerpt: z.string().max(300, "Keep the excerpt under 300 characters.").nullable(),
  contentMd: z.string(),
  coverImageUrl: z.url({ protocol: /^https?$/, error: "Enter a full image URL (https://…)." }).nullable(),
  author: z.string().max(100).nullable(),
  tags: z.array(z.string().max(40, "Keep each tag under 40 characters.")).max(20, "Use at most 20 tags."),
  metaTitle: z.string().max(70, "Search engines show about 60 characters.").nullable(),
  metaDescription: z.string().max(170, "Search engines show about 160 characters.").nullable(),
});

// intent: "draft" (save as draft), "publish", "unpublish", or "save" (keep status).
export async function savePost(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(fd, "id");
  const intent = text(fd, "intent");
  const title = text(fd, "title");

  const parsed = PostInput.safeParse({
    title,
    slug: text(fd, "slug") || slugify(title),
    excerpt: optionalText(fd, "excerpt"),
    contentMd: text(fd, "contentMd"),
    coverImageUrl: optionalText(fd, "coverImageUrl"),
    author: optionalText(fd, "author"),
    tags: text(fd, "tags")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    metaTitle: optionalText(fd, "metaTitle"),
    metaDescription: optionalText(fd, "metaDescription"),
  });
  if (!parsed.success) return invalid(parsed.error);
  if (intent === "publish" && !parsed.data.contentMd) {
    return fail("Write the post before publishing it.", { contentMd: ["The post is empty."] });
  }

  const existing =
    id && isUuid(id) ? await db().query.posts.findFirst({ where: eq(posts.id, id) }) : undefined;
  if (id && !existing) return fail("This post no longer exists.");

  const status =
    intent === "publish"
      ? "published"
      : intent === "draft" || intent === "unpublish"
        ? "draft"
        : (existing?.status ?? "draft");
  // Keep the first publish date if a post is unpublished and published again.
  const publishedAt =
    existing?.publishedAt ?? (status === "published" ? new Date() : null);

  let postId = existing?.id;
  try {
    if (existing) {
      await db().update(posts).set({ ...parsed.data, status, publishedAt }).where(eq(posts.id, existing.id));
    } else {
      const [row] = await db()
        .insert(posts)
        .values({ ...parsed.data, status, publishedAt })
        .returning({ id: posts.id });
      postId = row.id;
    }
  } catch (err) {
    if (isUniqueViolation(err, "posts_slug_unique")) {
      return fail("Another post already uses that URL.", { slug: ["Already used by another post."] });
    }
    throw err;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/blog");
  if (!existing) redirect(`/admin/blog/${postId}?created=1`);
  revalidatePath(`/admin/blog/${postId}`);

  if (intent === "publish" && existing.status !== "published") return { ok: true, message: "Published." };
  if (intent === "unpublish") return { ok: true, message: "Unpublished. The post is a draft again." };
  return { ok: true, message: status === "published" ? "Changes saved." : "Draft saved." };
}

export async function deletePost(id: string): Promise<ActionState> {
  await requireAdmin();
  if (isUuid(id)) await db().delete(posts).where(eq(posts.id, id));
  revalidatePath("/admin");
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}
