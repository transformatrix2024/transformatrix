import type { Program } from "@/content/programs";
import { cn } from "@/lib/utils";
import { SiteButton } from "./primitives";

// Grey card from the landing page row ("The Ink Within", "She Rises", …).
export function ProgramCard({
  title,
  tagline,
  href,
  cta,
  className,
}: {
  title: string;
  tagline: string;
  href: string;
  cta: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-40 flex-col justify-end rounded-md bg-tm-soft p-3 sm:p-4", className)}>
      <h3 className="text-[15px] leading-snug font-medium sm:text-[17px]">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-black/70">{tagline}</p>
      <SiteButton href={href} variant="mono" className="mt-3">
        {cta}
      </SiteButton>
    </div>
  );
}

export function ProgramTile({ program }: { program: Program }) {
  return (
    <ProgramCard
      title={program.name}
      tagline={program.tagline}
      href={`/programs/${program.slug}`}
      cta={program.comingSoon ? "Join the waitlist" : "View program"}
      className="sm:min-h-48"
    />
  );
}
