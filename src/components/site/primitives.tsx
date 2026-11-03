import Link from "next/link";
import { cn } from "@/lib/utils";

// A row of four cards. Same on every screen; on phones the cards and their
// text simply get smaller (see the max-sm: sizes in the card components).
export const CARD_GRID = "grid grid-cols-4 gap-1.5 sm:gap-3";

// Page width used by every section.
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1360px] px-2.5 sm:px-6", className)}>{children}</div>;
}

const BUTTON = {
  // Main call to action ("Explore Programs", "About Us").
  solid:
    "rounded-md bg-tm-ink px-3.5 py-2 text-[13px] font-medium text-white hover:bg-black/75 max-sm:px-2.5 max-sm:py-1.5 max-sm:text-[11px]",
  // Small monospace button used on cards ("Explore Workshops").
  mono: "rounded-md bg-tm-ink px-3 py-1.5 font-mono text-xs text-white hover:bg-black/75 max-sm:rounded max-sm:px-1.5 max-sm:py-1 max-sm:text-[9px] max-sm:leading-tight",
  // Grey pill ("Read Reflections", category filters).
  pill: "rounded-full bg-tm-pill px-3 py-1 font-mono text-xs text-tm-ink hover:bg-black/10 max-sm:px-2 max-sm:py-0.5 max-sm:text-[9px]",
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
    "inline-flex w-fit items-center gap-1.5 whitespace-nowrap transition-colors max-sm:whitespace-normal max-sm:text-left focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none",
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
        "inline-flex w-fit cursor-not-allowed items-center gap-2 rounded-md bg-tm-ink/40 px-3.5 py-2 text-[13px] font-medium text-white max-sm:gap-1.5 max-sm:px-2.5 max-sm:py-1.5 max-sm:text-[11px]",
        className,
      )}
    >
      {children}
      <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-[10px] uppercase max-sm:text-[9px]">Soon</span>
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-tm-pill px-2 py-0.5 font-mono text-[10px] text-tm-ink max-sm:px-1.5 max-sm:text-[9px]">{children}</span>;
}

// Where an image will go. Decorative until real images are added.
export function ImagePlaceholder({ className }: { className?: string }) {
  return <div aria-hidden className={cn("bg-checker rounded-lg", className)} />;
}

// Grey bars standing in for copy that hasn't been written yet.
export function TextPlaceholder({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("flex flex-col gap-2 max-sm:gap-1.5", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className={cn("h-2.5 rounded-full bg-black/10 max-sm:h-1.5", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SectionHeading({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={cn("text-[clamp(1rem,3vw,2.25rem)] leading-tight font-medium tracking-tight", className)}>
      {children}
    </h2>
  );
}
