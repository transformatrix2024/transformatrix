import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { FileText, Plus } from "lucide-react";
import { db } from "@/db";
import { POST_STATUSES, posts } from "@/db/schema";
import { LinkTabs } from "@/components/admin/link-tabs";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatDateTime } from "@/lib/dates";

export const metadata = { title: "Blog" };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = POST_STATUSES.find((s) => s === status);

  const rows = await db()
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(filter ? eq(posts.status, filter) : undefined)
    .orderBy(desc(posts.updatedAt));

  return (
    <>
      <PageHeader
        title="Blog"
        description="Write, publish and update blog posts."
        actions={
          <Button asChild>
            <Link href="/admin/blog/new">
              <Plus /> New post
            </Link>
          </Button>
        }
      />
      <LinkTabs
        className="mb-4"
        tabs={[
          { href: "/admin/blog", label: "All" },
          { href: "/admin/blog?status=published", label: "Published" },
          { href: "/admin/blog?status=draft", label: "Drafts" },
        ]}
      />

      {rows.length === 0 ? (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>{filter ? `No ${filter} posts` : "No posts yet"}</EmptyTitle>
              <EmptyDescription>Posts you write show up here.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/admin/blog/new">Write the first post</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Published</TableHead>
                <TableHead className="hidden pr-4 sm:table-cell">Last edited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="w-full max-w-0 pl-4">
                    <Link href={`/admin/blog/${p.id}`} className="block truncate font-medium hover:underline">
                      {p.title}
                    </Link>
                    <span className="block truncate text-xs text-muted-foreground">/blog/{p.slug}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(p.publishedAt)}</TableCell>
                  <TableCell className="hidden pr-4 text-muted-foreground sm:table-cell">{formatDateTime(p.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
