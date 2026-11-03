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
    <div className={cn("flex min-h-[110px] flex-col justify-end rounded-md bg-tm-soft p-2 sm:min-h-40 sm:p-4", className)}>
      <h3 className="text-[11px] leading-tight font-medium sm:text-[17px] sm:leading-snug">{title}</h3>
      <p className="mt-1 text-[9px] leading-snug text-black/70 sm:text-xs sm:leading-relaxed">{tagline}</p>
      <SiteButton href={href} variant="mono" className="mt-2 sm:mt-3">
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
