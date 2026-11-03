import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { CARD_ROW, Container, SectionHeading, SiteButton } from "@/components/site/primitives";
import { ProgramTile } from "@/components/site/program-card";
import { FAMILIES, PROGRAMS } from "@/content/programs";

export const metadata: Metadata = { title: "Programs" };

// Hub page: every program, grouped by family, each family an anchored section.
export default function ProgramsPage() {
  return (
    <Container>
      <PageHero
        title="Programs"
        intro="Workshops, trainings, immersions and 1:1 sessions. Pick a family to jump to its programs."
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {FAMILIES.map((family) => (
            <SiteButton key={family.id} href={`#${family.id}`} variant="pill" className="bg-white/70 hover:bg-white">
              {family.label}
            </SiteButton>
          ))}
        </div>
      </PageHero>

      {FAMILIES.map((family) => (
        <section key={family.id} id={family.id} className="mt-16 scroll-mt-6">
          <SectionHeading>{family.label}</SectionHeading>
          <div className={`mt-5 ${CARD_ROW}`}>
            {PROGRAMS.filter((p) => p.family === family.id).map((program) => (
              <ProgramTile key={program.slug} program={program} />
            ))}
          </div>
        </section>
      ))}
    </Container>
  );
}
