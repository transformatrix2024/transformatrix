import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { Container, ImagePlaceholder, Tag, TextPlaceholder } from "@/components/site/primitives";
import { ProgramCard } from "@/components/site/program-card";
import { POSTS, categorySlug } from "@/content/posts";
import { getProgram } from "@/content/programs";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  return { title: post?.title ?? "Blog" };
}

// A post ends with a card for the program it relates to.
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();
  const related = getProgram(post.relatedProgram);

  return (
    <Container>
      <PageHero
        crumbs={[
          { href: "/blog", label: "Blog" },
          { href: `/blog?category=${categorySlug(post.category)}`, label: post.category },
        ]}
        title={post.title}
      >
        <div className="mt-5 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </PageHero>

      <article className="mx-auto mt-12 max-w-2xl">
        <ImagePlaceholder className="aspect-[16/9] w-full" />
        <p className="mt-8 text-sm text-black/60">This article is coming soon.</p>
        <TextPlaceholder lines={8} className="mt-6" />
        <TextPlaceholder lines={6} className="mt-8" />

        {related && (
          <aside className="mt-14">
            <p className="mb-3 font-mono text-xs tracking-wide text-black/55 uppercase">Related program</p>
            <ProgramCard
              title={related.name}
              tagline={related.tagline}
              href={`/programs/${related.slug}`}
              cta="View program"
            />
          </aside>
        )}
      </article>
    </Container>
  );
}
