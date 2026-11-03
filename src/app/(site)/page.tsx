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

export default function HomePage() {
  const nalini = FACILITATORS[0];

  return (
    <Container>
      {/* Hero */}
      <section className="flex min-h-[480px] flex-col rounded-lg bg-tm-card p-4 sm:min-h-[560px] sm:p-6 lg:min-h-[600px]">
        <Nav />
        <div className="mt-10 flex flex-1 flex-col justify-between gap-14 lg:mt-14">
          <div className="max-w-[260px] self-end text-right sm:max-w-[300px]">
            <p className="text-[13px] leading-relaxed">
              Workshops, trainings, and 1:1 sessions designed to support healing, awareness, and embodied
              self-leadership — for adults, women, children, and beyond.
            </p>
            <Link
              href="/programs/one-to-one"
              className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium underline underline-offset-4"
            >
              Work With Us 1:1 <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div>
            <h1 className="text-[clamp(2.25rem,4.6vw,3.25rem)] leading-[1.08] font-medium tracking-tight">
              Tools, Trainings &amp; Experiences
              <br className="max-sm:hidden" /> for Conscious Living
            </h1>
            <SiteButton href="/programs" className="mt-5">
              Explore Programs
            </SiteButton>
          </div>
        </div>
      </section>

      {/* Featured programs and post: four across, 2×2 on phones */}
      <section className={`mt-4 ${CARD_GRID}`} aria-label="Featured">
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
        <article className="flex flex-col p-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <ImagePlaceholder className="aspect-[16/10] w-full shrink-0 rounded-md sm:aspect-square sm:w-[42%]" />
            <h3 className="text-[15px] leading-snug font-medium sm:text-[17px]">
              Why Inner Work Needs Integration, Not Intensity
            </h3>
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-1.5">
            <Tag>Reflection</Tag>
            <Tag>Inner Work</Tag>
          </div>
          <p className="mt-2 text-xs text-black/70">Why Inner Work Needs Integration, Not Intensity.</p>
          <SiteButton href="/blog/why-inner-work-needs-integration-not-intensity" variant="mono" className="mt-3">
            Read more
          </SiteButton>
        </article>
      </section>

      {/* Experiences + participants */}
      <section className="mt-16 grid gap-8 sm:mt-24 sm:grid-cols-[1.2fr_1fr] sm:items-start sm:gap-10 lg:mt-28">
        <p className="max-w-[17ch] text-[clamp(2rem,3.6vw,2.75rem)] leading-[1.15] font-medium tracking-tight">
          Experiences designed for inner work — integrated into everyday life.
        </p>
        <div className="max-w-[85%] justify-self-end sm:max-w-sm">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="size-10 rounded-full border-2 border-white bg-tm-pill" />
              ))}
            </div>
            <p className="font-mono text-xs leading-snug font-semibold">
              300+ participants across
              <br />
              workshops &amp; 1:1 sessions
            </p>
          </div>
          <p className="mt-4 text-sm leading-relaxed">
            Reflections from people who&apos;ve experienced Transformatrix work — and integrated it into everyday
            life.
          </p>
          <div className="mt-3 flex gap-2">
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
      <section className="mt-20 grid grid-cols-[1.4fr_1fr] gap-x-4 gap-y-5 sm:mt-28 sm:gap-8 md:grid-cols-[1.2fr_1fr] lg:mt-36 lg:grid-cols-[0.8fr_1.7fr_1.5fr]">
        <p className="col-span-2 text-xs font-medium tracking-wide uppercase lg:col-span-1">About Transformatrix</p>
        <div className="flex flex-col">
          <SectionHeading className="max-w-[16ch] text-[clamp(1.5rem,2.4vw,1.75rem)]">
            The Philosophy Behind Transformatrix
          </SectionHeading>
          <div className="mt-5 flex flex-col gap-1 text-[13px] leading-relaxed">
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
          <SiteButton href="/about" className="mt-6 md:mt-auto">
            About Us
          </SiteButton>
        </div>
        <ImagePlaceholder className="aspect-[3/4] w-full self-start md:aspect-[4/3]" />
      </section>

      {/* She Rises */}
      <section className="mt-12 grid grid-cols-[minmax(0,40%)_1fr] gap-4 rounded-lg bg-tm-card p-4 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <ImagePlaceholder className="aspect-[3/4] w-full" />
        <div className="flex flex-col justify-between gap-8">
          <SectionHeading>She Rises — Online / Offline</SectionHeading>
          <SiteButton href="/programs/she-rises">Join the Next Circle</SiteButton>
        </div>
      </section>

      {/* Reflections (testimonials to come) */}
      <section id="reflections" aria-label="Reflections" className={`mt-12 scroll-mt-6 ${CARD_GRID}`}>
        {[0, 1, 2, 3].map((i) => (
          <figure key={i} className="flex flex-col gap-4 rounded-md bg-tm-card p-3">
            <div className="flex items-center gap-3">
              <span aria-hidden className="size-10 rounded-full bg-white/70" />
              <span aria-hidden className="h-4 flex-1 rounded-sm bg-white/70" />
            </div>
            <TextPlaceholder lines={4} className="[&>span]:bg-white/70" />
            <span aria-hidden className="ml-auto h-3 w-1/3 rounded-sm bg-white/70" />
          </figure>
        ))}
      </section>

      {/* Facilitators */}
      <section className="mt-16">
        <SectionHeading>Those Holding the Space</SectionHeading>
        <div className="mt-6 grid grid-cols-[1fr_minmax(0,40%)] gap-4 rounded-lg bg-tm-card p-4 sm:gap-6 sm:p-8 lg:grid-cols-[1fr_minmax(0,300px)]">
          <div className="flex flex-col justify-between gap-10">
            <h3 className="text-2xl font-medium">{nalini.name}</h3>
            <SiteButton href={nalini.oneToOne} variant="mono" className="max-sm:whitespace-normal lg:self-center">
              Work 1:1 with {nalini.name}
            </SiteButton>
          </div>
          <ImagePlaceholder className="aspect-[4/5] w-full" />
        </div>
        <Link href="/about/facilitators" className="mt-3 inline-block text-sm underline underline-offset-4">
          Meet all facilitators
        </Link>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <SectionHeading>Questions You May Be Holding</SectionHeading>
        <div className="mt-6 grid grid-cols-[1fr_1.8fr] gap-3 sm:grid-cols-[1fr_1.6fr] sm:gap-8">
          <ImagePlaceholder className="aspect-[3/4] w-full self-start" />
          <div className="flex flex-col gap-4">
            <FaqList />
            <SiteButton href="/contact#faq" variant="mono">
              Read More
            </SiteButton>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mt-16 rounded-lg bg-tm-card px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-xl">
          <SectionHeading>Reflections, Practices &amp; Invitations</SectionHeading>
          <p className="mt-4 max-w-sm text-xs leading-relaxed">
            Occasional notes from the Transformatrix field — reflections, practices, and upcoming journeys.
          </p>
          <SoonForm button="Join the Circle" className="mt-4">
            <SoonInput label="Your email" type="email" autoComplete="email" required className="sm:max-w-80" />
          </SoonForm>
        </div>
      </section>

      {/* Contact prompt */}
      <section className="mt-16 grid grid-cols-[1fr_minmax(0,42%)] gap-4 sm:gap-8 lg:grid-cols-[1fr_minmax(0,380px)]">
        <div>
          <SectionHeading>Not Sure Where to Begin?</SectionHeading>
          <p className="mt-10 max-w-sm text-[13px] leading-relaxed">
            If you&apos;re feeling called but unsure which space is right for you, reach out.
          </p>
          <p className="mt-3 text-[13px]">We&apos;ll guide you.</p>
          <SiteButton href="/contact" className="mt-5">
            Get in Touch
          </SiteButton>
        </div>
        <ImagePlaceholder className="aspect-[4/3] w-full" />
      </section>
    </Container>
  );
}
