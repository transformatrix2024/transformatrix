import Link from "next/link";
import { cn } from "@/lib/utils";

// A row of four cards, as on desktop. On phones it becomes a swipeable row
// instead of stacking, so the page keeps its desktop rhythm.
export const CARD_ROW =
  "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] *:w-[72%] *:shrink-0 *:snap-start sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:*:w-auto";

// Page width used by every section.
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>{children}</div>;
}

const BUTTON = {
  // Main call to action ("Explore Programs", "About Us").
  solid: "rounded-md bg-tm-ink px-3.5 py-2 text-[13px] font-medium text-white hover:bg-black/75",
  // Small monospace button used on cards ("Explore Workshops").
  mono: "rounded-md bg-tm-ink px-3 py-1.5 font-mono text-xs text-white hover:bg-black/75",
  // Grey pill ("Read Reflections", category filters).
  pill: "rounded-full bg-tm-pill px-3 py-1 font-mono text-xs text-tm-ink hover:bg-black/10",
};

export function SiteButton({
  href,
  variant = "solid",
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof BUTTON;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = cn(
    "inline-flex w-fit items-center gap-1.5 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none",
    BUTTON[variant],
    className,
  );
  if (/^https?:/.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

// A button for something that isn't live yet (checkout, booking, shop).
export function SoonButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      aria-disabled="true"
      title="Opens soon"
      className={cn(
        "inline-flex w-fit cursor-not-allowed items-center gap-2 rounded-md bg-tm-ink/40 px-3.5 py-2 text-[13px] font-medium text-white",
        className,
      )}
    >
      {children}
      <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-[10px] uppercase">Soon</span>
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-tm-pill px-2 py-0.5 font-mono text-[10px] text-tm-ink">{children}</span>;
}

// Where an image will go. Decorative until real images are added.
export function ImagePlaceholder({ className }: { className?: string }) {
  return <div aria-hidden className={cn("bg-checker rounded-lg", className)} />;
}

// Grey bars standing in for copy that hasn't been written yet.
export function TextPlaceholder({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className={cn("h-2.5 rounded-full bg-black/10", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SectionHeading({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={cn("text-[clamp(1.75rem,3vw,2.25rem)] leading-tight font-medium tracking-tight", className)}>
      {children}
    </h2>
  );
}
