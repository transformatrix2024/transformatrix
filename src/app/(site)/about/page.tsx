import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Container, ImagePlaceholder, SectionHeading, TextPlaceholder } from "@/components/site/primitives";

export const metadata: Metadata = { title: "About" };

// "Our story": philosophy, approach, accreditations, and the way to the
// facilitators and contact pages.
export default function AboutPage() {
  return (
    <Container>
      <PageHero
        title="Our story"
        intro="Transformatrix is a space for experiential inner work — rooted in awareness, honesty, and lived practice."
      />

      <section className="mt-16 grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionHeading>The Philosophy Behind Transformatrix</SectionHeading>
          <div className="mt-5 flex max-w-lg flex-col gap-3 text-[15px] leading-relaxed">
            <p>Our work offers tools, not dependency; clarity, not fixing.</p>
            <p>
              Each experience is designed to help you understand yourself more deeply, regulate your inner world,
              and integrate change into everyday life — gently and sustainably.
            </p>
          </div>
        </div>
        <ImagePlaceholder className="aspect-[4/3] w-full" />
      </section>

      <section className="mt-16 grid gap-3 md:grid-cols-2">
        {["Our approach", "Accreditations"].map((title) => (
          <div key={title} className="rounded-lg bg-tm-soft p-6">
            <h2 className="text-xl font-medium">{title}</h2>
            <p className="mt-2 text-sm text-black/60">Coming soon.</p>
            <TextPlaceholder lines={3} className="mt-4" />
          </div>
        ))}
      </section>

      <section className="mt-16 grid gap-3 md:grid-cols-2">
        {[
          { href: "/about/facilitators", title: "Facilitators", text: "Meet Nalini, Anjali and our guest facilitators." },
          { href: "/contact", title: "Contact", text: "Write to us, book a discovery call, or read the FAQ." },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="group flex items-end justify-between gap-4 rounded-lg bg-tm-card p-6 hover:bg-black/15">
            <span>
              <span className="block text-2xl font-medium">{card.title}</span>
              <span className="mt-1 block text-sm text-black/70">{card.text}</span>
            </span>
            <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </section>
    </Container>
  );
}
