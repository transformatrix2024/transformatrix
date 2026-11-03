import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Container, ImagePlaceholder, SectionHeading, SoonButton } from "@/components/site/primitives";
import { SoonForm, SoonInput } from "@/components/site/soon-form";

export const metadata: Metadata = { title: "Shop" };

const COMING_SOON = ["Anjali's book", "Journals", "Tarot & oracle cards"];

export default function ShopPage() {
  return (
    <Container>
      <PageHero title="Shop" intro="Books, journals and tools for your practice." />

      {/* Featured here; there's no separate product page yet. */}
      <section className="mt-12 grid grid-cols-[minmax(0,40%)_1fr] gap-4 rounded-lg bg-tm-card p-4 sm:gap-8 sm:p-8">
        <ImagePlaceholder className="aspect-[3/4] w-full" />
        <div className="flex flex-col justify-between gap-6">
          <div>
            <p className="font-mono text-xs tracking-wide text-black/55 uppercase">Featured</p>
            <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.25rem)] leading-tight font-medium">The INK Within® book</h2>
            <p className="mt-3 max-w-md text-sm text-black/70">
              The journaling practice behind The INK Within®, in book form.
            </p>
          </div>
          {/* Will open a Razorpay payment link that also collects the shipping address. */}
          <SoonButton>Buy the book</SoonButton>
        </div>
      </section>

      <section className="mt-16">
        <SectionHeading>Coming soon</SectionHeading>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {COMING_SOON.map((item) => (
            <div key={item} className="flex flex-col gap-3">
              <ImagePlaceholder className="aspect-square w-full" />
              <p className="text-sm font-medium sm:text-[15px]">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-lg bg-tm-soft p-6">
          <p className="text-sm font-medium">Want to know when these arrive?</p>
          <SoonForm button="Notify me" className="mt-3">
            <SoonInput label="Your email" type="email" required className="sm:max-w-80" />
          </SoonForm>
        </div>
      </section>
    </Container>
  );
}
