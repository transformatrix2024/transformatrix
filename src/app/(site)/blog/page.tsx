import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Container, ImagePlaceholder, SiteButton, Tag } from "@/components/site/primitives";
import { CATEGORIES, POSTS, categorySlug } from "@/content/posts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const active = CATEGORIES.find((c) => categorySlug(c) === category);
  const posts = POSTS.filter((p) => !active || p.category === active);

  return (
    <Container>
      <PageHero title="Blog" intro="Reflections, practices and notes from the Transformatrix field." />

      <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-2">
        {[undefined, ...CATEGORIES].map((c) => (
          <Link
            key={c ?? "all"}
            href={c ? `/blog?category=${categorySlug(c)}` : "/blog"}
            aria-current={active === c ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 font-mono text-xs",
              active === c ? "bg-tm-ink text-white" : "bg-tm-pill hover:bg-black/10",
            )}
          >
            {c ?? "All"}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="mt-8 rounded-lg bg-tm-soft p-6 text-sm text-black/60">
          Posts about {active} are coming soon.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-x-2 gap-y-6 sm:mt-8 sm:gap-x-3 sm:gap-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="flex flex-col">
              <ImagePlaceholder className="aspect-[4/3] w-full" />
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag>{post.category}</Tag>
                {post.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <h2 className="mt-2 text-lg leading-snug font-medium">{post.title}</h2>
              <p className="mt-1 text-sm text-black/70">{post.excerpt}</p>
              <SiteButton href={`/blog/${post.slug}`} variant="mono" className="mt-3">
                Read more
              </SiteButton>
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}
