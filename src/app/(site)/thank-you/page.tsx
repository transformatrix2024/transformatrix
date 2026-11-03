import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Container, SiteButton, SoonButton } from "@/components/site/primitives";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

// Where buyers land after paying (once checkout is built).
export default function ThankYouPage() {
  const steps = [
    "You'll get a confirmation email with your receipt.",
    "A few days before, we'll send the joining details.",
    "Add the date to your calendar so you don't miss it.",
  ];
  return (
    <Container>
      <PageHero title="Thank you — you're in." intro="Here's what happens next.">
        <ol className="mt-6 flex max-w-lg flex-col gap-2">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3 rounded-md bg-white/70 p-3 text-sm">
              <span className="font-mono text-xs font-semibold">0{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-2">
          <SoonButton>Add to calendar</SoonButton>
          <SiteButton href="/programs" variant="pill" className="bg-white/70 py-2">
            Explore more programs
          </SiteButton>
        </div>
      </PageHero>
    </Container>
  );
}
