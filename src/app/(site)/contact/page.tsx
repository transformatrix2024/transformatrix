import type { Metadata } from "next";
import { FaqList } from "@/components/site/faq-list";
import { PageHero } from "@/components/site/page-hero";
import { Container, SectionHeading, SoonButton } from "@/components/site/primitives";
import { SoonForm, SoonInput } from "@/components/site/soon-form";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <Container>
      <PageHero
        crumbs={[{ href: "/about", label: "About" }]}
        title="Get in Touch"
        intro="If you're feeling called but unsure which space is right for you, reach out. We'll guide you."
      />

      <section className="mt-6 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3 sm:mt-12 sm:gap-6">
        <div className="rounded-lg bg-tm-soft p-6">
          <h2 className="text-xl font-medium">Write to us</h2>
          <SoonForm button="Send message" layout="stacked" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              <SoonInput label="Your name" autoComplete="name" required />
              <SoonInput label="Your email" type="email" autoComplete="email" required />
            </div>
            <textarea
              aria-label="Your message"
              placeholder="Your message"
              required
              rows={5}
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none placeholder:text-black/40 focus:border-black/40"
            />
          </SoonForm>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-lg bg-tm-card p-6">
          <div>
            <h2 className="text-xl font-medium">Book a discovery call</h2>
            <p className="mt-2 text-sm text-black/70">
              A short call to find the right program or 1:1 work for you.
            </p>
          </div>
          <SoonButton>Book a call</SoonButton>
        </div>
      </section>

      <section id="faq" className="mt-16 scroll-mt-6">
        <SectionHeading>Questions You May Be Holding</SectionHeading>
        <div className="mt-6 max-w-3xl">
          <FaqList />
        </div>
      </section>
    </Container>
  );
}
