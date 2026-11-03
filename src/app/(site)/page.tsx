import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FaqList } from "@/components/site/faq-list";
import { Nav } from "@/components/site/page-hero";
import {
  CARD_GRID,
  Container,
  ImagePlaceholder,
  SectionHeading,
  SiteButton,
  Tag,
  TextPlaceholder,
} from "@/components/site/primitives";
import { ProgramCard } from "@/components/site/program-card";
import { SoonForm, SoonInput } from "@/components/site/soon-form";
import { FACILITATORS } from "@/content/people";

// Every section keeps its desktop arrangement on every screen. Phones only get
// smaller type and spacing (the max-sm: / sm: sizes), never a different layout.
export default function HomePage() {
  const nalini = FACILITATORS[0];

  return (
    <Container>
      {/* Hero */}
      <section className="flex min-h-[340px] flex-col rounded-lg bg-tm-card p-3 sm:min-h-[560px] sm:p-6 lg:min-h-[600px]">
        <Nav />
        <div className="mt-6 flex flex-1 flex-col justify-between gap-8 sm:mt-10 sm:gap-14 lg:mt-14">
          <div className="w-[52%] max-w-[300px] self-end text-right">
            <p className="text-[10px] leading-relaxed sm:text-[13px]">
              Workshops, trainings, and 1:1 sessions designed to support healing, awareness, and embodied
              self-leadership — for adults, women, children, and beyond.
            </p>
            <Link
              href="/programs/one-to-one"
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium underline underline-offset-4 sm:mt-4 sm:text-[13px]"
            >
              Work With Us 1:1 <ArrowUpRight className="size-3 sm:size-4" />
            </Link>
          </div>
          <div>
            <h1 className="text-[clamp(1.15rem,4.6vw,3.25rem)] leading-[1.08] font-medium tracking-tight">
              Tools, Trainings &amp; Experiences
              <br /> for Conscious Living
            </h1>
            <SiteButton href="/programs" className="mt-3 sm:mt-5">
              Explore Programs
            </SiteButton>
          </div>
        </div>
      </section>

      {/* Featured programs and post: four across */}
      <section className={`mt-1.5 sm:mt-4 ${CARD_GRID}`} aria-label="Featured">
        <ProgramCard
          title="The Ink Within"
          tagline="Journaling for Reflection & Inner Alignment"
          href="/programs/ink-within"
          cta="Explore Workshops"
        />
        <ProgramCard
          title="She Rises"
          tagline="A Women's Empowerment & Inner Alignment Experience"
          href="/programs/she-rises"
          cta="Discover Experiences"
        />
        <ProgramCard
          title="Quantum Healing Practitioner"
          tagline="Quantum Healing Practitioner Course - Lvl 1"
          href="/programs/quantum-resonance"
          cta="Train as a Practitioner"
        />
        <article className="flex flex-col p-0.5 sm:p-1">
          {/* On phones the card is too narrow for image and title side by side. */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
            <ImagePlaceholder className="aspect-[4/3] w-full shrink-0 rounded-md sm:aspect-square sm:w-[42%]" />
            <h3 className="text-[11px] leading-tight font-medium sm:text-[17px] sm:leading-snug">
              Why Inner Work Needs Integration, Not Intensity
            </h3>
          </div>
          <div className="mt-1.5 flex flex-wrap justify-end gap-1 sm:mt-2 sm:gap-1.5">
            <Tag>Reflection</Tag>
            <Tag>Inner Work</Tag>
          </div>
          <p className="mt-1.5 text-[9px] leading-snug text-black/70 sm:mt-2 sm:text-xs">
            Why Inner Work Needs Integration, Not Intensity.
          </p>
          <SiteButton href="/blog/why-inner-work-needs-integration-not-intensity" variant="mono" className="mt-2 sm:mt-3">
            Read more
          </SiteButton>
        </article>
      </section>

      {/* Experiences + participants */}
      <section className="mt-10 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start gap-4 sm:mt-24 sm:gap-10 lg:mt-28">
        <p className="max-w-[17ch] text-[clamp(1rem,3.6vw,2.75rem)] leading-[1.15] font-medium tracking-tight">
          Experiences designed for inner work — integrated into everyday life.
        </p>
        <div className="max-w-sm justify-self-end">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex -space-x-1.5 sm:-space-x-3" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="size-5 rounded-full border-2 border-white bg-tm-pill sm:size-10" />
              ))}
            </div>
            <p className="font-mono text-[9px] leading-snug font-semibold sm:text-xs">
              300+ participants across
              <br />
              workshops &amp; 1:1 sessions
            </p>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed sm:mt-4 sm:text-sm">
            Reflections from people who&apos;ve experienced Transformatrix work — and integrated it into everyday
            life.
          </p>
          <div className="mt-2 flex flex-wrap gap-1 sm:mt-3 sm:gap-2">
            <SiteButton href="#reflections" variant="pill">
              Read Reflections
            </SiteButton>
            <SiteButton href="#reflections" variant="pill">
              Stories
            </SiteButton>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mt-12 grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.7fr)_minmax(0,1.5fr)] gap-3 sm:mt-28 sm:gap-8 lg:mt-36">
        <p className="text-[9px] font-medium tracking-wide uppercase sm:text-xs">About Transformatrix</p>
        <div className="flex flex-col">
          <SectionHeading className="max-w-[16ch] text-[clamp(0.8rem,2.4vw,1.75rem)]">
            The Philosophy Behind Transformatrix
          </SectionHeading>
          <div className="mt-2 flex flex-col gap-1 text-[10px] leading-relaxed sm:mt-5 sm:text-[13px]">
            <p>
              Transformatrix is a space for experiential inner work — rooted in awareness, honesty, and lived
              practice.
            </p>
            <p>Our work offers tools, not dependency; clarity, not fixing.</p>
            <p>
              Each experience is designed to help you understand yourself more deeply, regulate your inner world,
              and integrate change into everyday life — gently and sustainably.
            </p>
          </div>
          <SiteButton href="/about" className="mt-3 sm:mt-auto">
            About Us
          </SiteButton>
        </div>
        <ImagePlaceholder className="aspect-[4/3] w-full" />
      </section>

      {/* She Rises */}
      <section className="mt-4 grid grid-cols-[minmax(0,28%)_minmax(0,1fr)] gap-3 rounded-lg bg-tm-card p-3 sm:mt-12 sm:gap-6 sm:p-6">
        <ImagePlaceholder className="aspect-[3/4] w-full" />
        <div className="flex flex-col justify-between gap-4 sm:gap-8">
          <SectionHeading>She Rises — Online / Offline</SectionHeading>
          <SiteButton href="/programs/she-rises">Join the Next Circle</SiteButton>
        </div>
      </section>

      {/* Reflections (testimonials to come) */}
      <section id="reflections" aria-label="Reflections" className={`mt-4 scroll-mt-6 sm:mt-12 ${CARD_GRID}`}>
        {[0, 1, 2, 3].map((i) => (
          <figure key={i} className="flex flex-col gap-2 rounded-md bg-tm-card p-2 sm:gap-4 sm:p-3">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <span aria-hidden className="size-5 shrink-0 rounded-full bg-white/70 sm:size-10" />
              <span aria-hidden className="h-2 flex-1 rounded-sm bg-white/70 sm:h-4" />
            </div>
            <TextPlaceholder lines={4} className="[&>span]:bg-white/70" />
            <span aria-hidden className="ml-auto h-1.5 w-1/3 rounded-sm bg-white/70 sm:h-3" />
          </figure>
        ))}
      </section>

      {/* Facilitators */}
      <section className="mt-8 sm:mt-16">
        <SectionHeading>Those Holding the Space</SectionHeading>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,26%)] gap-3 rounded-lg bg-tm-card p-3 sm:mt-6 sm:gap-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:gap-10">
            <h3 className="text-sm font-medium sm:text-2xl">{nalini.name}</h3>
            <SiteButton href={nalini.oneToOne} variant="mono" className="self-center">
              Work 1:1 with {nalini.name}
            </SiteButton>
          </div>
          <ImagePlaceholder className="aspect-[4/5] w-full" />
        </div>
        <Link
          href="/about/facilitators"
          className="mt-2 inline-block text-[11px] underline underline-offset-4 sm:mt-3 sm:text-sm"
        >
          Meet all facilitators
        </Link>
      </section>

      {/* FAQ */}
      <section className="mt-8 sm:mt-16">
        <SectionHeading>Questions You May Be Holding</SectionHeading>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 sm:mt-6 sm:gap-8">
          <ImagePlaceholder className="aspect-[3/4] w-full self-start" />
          <div className="flex flex-col gap-2 sm:gap-4">
            <FaqList />
            <SiteButton href="/contact#faq" variant="mono">
              Read More
            </SiteButton>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mt-8 rounded-lg bg-tm-card px-4 py-8 sm:mt-16 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-xl">
          <SectionHeading>Reflections, Practices &amp; Invitations</SectionHeading>
          <p className="mt-2 max-w-sm text-[10px] leading-relaxed sm:mt-4 sm:text-xs">
            Occasional notes from the Transformatrix field — reflections, practices, and upcoming journeys.
          </p>
          <SoonForm button="Join the Circle" className="mt-3 sm:mt-4">
            <SoonInput label="Your email" type="email" autoComplete="email" required className="max-w-80" />
          </SoonForm>
        </div>
      </section>

      {/* Contact prompt */}
      <section className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,33%)] gap-3 sm:mt-16 sm:gap-8">
        <div>
          <SectionHeading>Not Sure Where to Begin?</SectionHeading>
          <p className="mt-3 max-w-sm text-[10px] leading-relaxed sm:mt-10 sm:text-[13px]">
            If you&apos;re feeling called but unsure which space is right for you, reach out.
          </p>
          <p className="mt-1.5 text-[10px] sm:mt-3 sm:text-[13px]">We&apos;ll guide you.</p>
          <SiteButton href="/contact" className="mt-3 sm:mt-5">
            Get in Touch
          </SiteButton>
        </div>
        <ImagePlaceholder className="aspect-[4/3] w-full" />
      </section>
    </Container>
  );
}
