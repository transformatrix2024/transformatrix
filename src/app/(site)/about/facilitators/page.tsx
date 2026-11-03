import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import {
  Container,
  ImagePlaceholder,
  SectionHeading,
  SiteButton,
  TextPlaceholder,
} from "@/components/site/primitives";
import { FACILITATORS } from "@/content/people";

export const metadata: Metadata = { title: "Facilitators" };

export default function FacilitatorsPage() {
  return (
    <Container>
      <PageHero
        crumbs={[{ href: "/about", label: "About" }]}
        title="Those Holding the Space"
        intro="The facilitators behind Transformatrix programs and 1:1 sessions."
      />

      <div className="mt-12 flex flex-col gap-6">
        {FACILITATORS.map((person) => (
          <section
            key={person.id}
            id={person.id}
            className="grid scroll-mt-6 grid-cols-[1fr_minmax(0,40%)] gap-4 rounded-lg bg-tm-card p-4 sm:gap-6 sm:p-8"
          >
            <div className="flex flex-col justify-between gap-8">
              <div>
                <h2 className="text-2xl font-medium">{person.name}</h2>
                <p className="mt-2 text-sm text-black/60">Bio coming soon.</p>
                <TextPlaceholder lines={4} className="mt-4 max-w-md [&>span]:bg-white/60" />
              </div>
              <div className="flex flex-wrap gap-2">
                <SiteButton href={person.oneToOne} variant="mono">
                  Work 1:1 with {person.name}
                </SiteButton>
                {person.website && (
                  <SiteButton href={person.website} variant="pill" className="bg-white/70">
                    {person.website.replace("https://", "")} <ArrowUpRight className="size-3.5" />
                  </SiteButton>
                )}
              </div>
            </div>
            <ImagePlaceholder className="aspect-[4/5] w-full" />
          </section>
        ))}
      </div>

      <section id="guests" className="mt-16 scroll-mt-6">
        <SectionHeading>Guest facilitators</SectionHeading>
        <p className="mt-3 text-sm text-black/60">Guest facilitators will be introduced here.</p>
      </section>
    </Container>
  );
}
