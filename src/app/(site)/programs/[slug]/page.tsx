import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { DateList } from "@/components/site/date-views";
import { PageHero } from "@/components/site/page-hero";
import {
  Container,
  ImagePlaceholder,
  SectionHeading,
  SiteButton,
  SoonButton,
  TextPlaceholder,
} from "@/components/site/primitives";
import { SoonForm, SoonInput } from "@/components/site/soon-form";
import { UPCOMING_DATES } from "@/content/dates";
import { FACILITATORS } from "@/content/people";
import { PROGRAMS, getProgram } from "@/content/programs";
import { cn } from "@/lib/utils";
import { upcomingOnly } from "@/lib/calendar";

export function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const program = getProgram((await params).slug);
  return { title: program?.name ?? "Program" };
}

// One template for every program. Levels, formats and sister programs are
// tabs (?tab=…) on the same page.
export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const program = getProgram(slug);
  if (!program) notFound();

  const { tab } = await searchParams;
  const activeTab = program.tabs?.find((t) => t.id === tab) ?? program.tabs?.[0];
  const programDates = upcomingOnly(UPCOMING_DATES.filter((d) => d.program === slug));
  // Format tabs (Online / Immersion / Retreat) also filter the dates.
  const tabDates = programDates.filter((d) => d.format.toLowerCase() === activeTab?.id);
  const dates = tabDates.length ? tabDates : programDates;
  const facilitator = slug === "one-to-one" ? FACILITATORS.find((f) => f.id === activeTab?.id) : undefined;

  return (
    <Container>
      <PageHero crumbs={[{ href: "/programs", label: "Programs" }]} title={program.name} intro={program.tagline}>
        {program.comingSoon && (
          <p className="mt-5 w-fit rounded-full bg-white/70 px-3 py-1 font-mono text-xs">Coming soon</p>
        )}
      </PageHero>

      {program.tabs && activeTab && (
        <nav aria-label={`${program.name} options`} className="mt-4 flex flex-wrap gap-2">
          {program.tabs.map((t) => (
            <Link
              key={t.id}
              href={`/programs/${slug}?tab=${t.id}`}
              scroll={false}
              aria-current={t.id === activeTab.id ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-mono text-xs transition-colors",
                t.id === activeTab.id ? "bg-tm-ink text-white" : "bg-tm-pill hover:bg-black/10",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      )}

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="font-mono text-xs tracking-wide text-black/55 uppercase">{activeTab?.label ?? "Overview"}</p>
          <SectionHeading className="mt-2">
            {program.name}
            {activeTab ? ` · ${activeTab.label}` : ""}
          </SectionHeading>
          {program.note && <p className="mt-4 text-[15px] leading-relaxed">{program.note}</p>}
          <p className="mt-4 text-sm text-black/60">The full description for this page is coming soon.</p>
          <TextPlaceholder lines={5} className="mt-6 max-w-lg" />

          {facilitator && (
            <div className="mt-8 flex flex-wrap gap-2">
              <SoonButton>Book a session with {facilitator.name}</SoonButton>
              {facilitator.website && (
                <SiteButton href={facilitator.website} variant="pill">
                  {facilitator.website.replace("https://", "")} <ArrowUpRight className="size-3.5" />
                </SiteButton>
              )}
            </div>
          )}
          {slug === "speaking" && (
            <div className="mt-8 flex flex-wrap gap-2">
              <SiteButton href="/contact">Enquire about a talk</SiteButton>
              <SiteButton href="/programs/ink-within?tab=at-work" variant="pill">
                The INK Within® @ Work
              </SiteButton>
            </div>
          )}
        </div>
        <ImagePlaceholder className="aspect-[4/3] w-full" />
      </section>

      {slug !== "one-to-one" && slug !== "speaking" && (
        <section className="mt-16">
          <SectionHeading>{program.comingSoon ? "Join the waitlist" : "Upcoming dates"}</SectionHeading>
          <div className="mt-6">
            {program.comingSoon ? (
              <div className="rounded-lg bg-tm-soft p-6">
                <p className="max-w-md text-sm">Dates aren&apos;t set yet. Leave your email and we&apos;ll tell you first.</p>
                <SoonForm button="Join the waitlist" className="mt-4">
                  <SoonInput label="Your email" type="email" required className="sm:max-w-80" />
                </SoonForm>
              </div>
            ) : (
              <DateList dates={dates} linkToProgram={false} empty="No dates announced yet. Check back soon." />
            )}
          </div>
        </section>
      )}
    </Container>
  );
}
