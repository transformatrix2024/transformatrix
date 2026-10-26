import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { FlashToast } from "@/components/admin/flash-toast";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import { isUuid } from "@/lib/ids";
import { storageConfigured } from "@/lib/storage";
import { deletePost } from "../actions";
import { PostForm } from "../post-form";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const post = await findPost(id);
  if (!post) notFound();

  return (
    <>
      <FlashToast message="Post created." />
      <PageHeader
        title={post.title}
        back={{ href: "/admin/blog", label: "Blog" }}
        description={`Last edited ${formatDateTime(post.updatedAt)}`}
        actions={
          <ConfirmAction
            trigger={
              <Button variant="destructive">
                <Trash2 /> Delete
              </Button>
            }
            title="Delete this post?"
            description="It will be removed from the blog straight away. This can't be undone."
            confirmLabel="Delete post"
            destructive
            action={deletePost.bind(null, post.id)}
          />
        }
      />
      <PostForm post={post} uploadsEnabled={storageConfigured()} />
    </>
  );
}

async function findPost(id: string) {
  if (!isUuid(id)) return undefined;
  return db().query.posts.findFirst({ where: eq(posts.id, id) });
}
