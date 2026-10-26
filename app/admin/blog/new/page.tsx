import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin";
import { storageConfigured } from "@/lib/storage";
import { PostForm } from "../post-form";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="New post" back={{ href: "/admin/blog", label: "Blog" }} />
      <PostForm uploadsEnabled={storageConfigured()} />
    </>
  );
}
