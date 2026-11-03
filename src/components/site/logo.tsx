import { cn } from "@/lib/utils";

// Text versions of the Transformatrix logo, until the logo files arrive.

function Asterisk({ className }: { className?: string }) {
  const arms = ["#29abe2", "#ec008c", "#ffd400", "#29abe2", "#8dc63f", "#ec008c"];
  return (
    <svg viewBox="-12 -12 24 24" aria-hidden className={className}>
      {arms.map((color, i) => (
        <line
          key={i}
          x1="0"
          y1="0"
          x2="0"
          y2="-10"
          stroke={color}
          strokeWidth="3.2"
          strokeLinecap="round"
          transform={`rotate(${i * 60})`}
        />
      ))}
    </svg>
  );
}

// Small logo for the navigation bar.
export function Wordmark({ className }: { className?: string }) {
  return (
    // Artwork: the link around it carries the accessible name.
    <span aria-hidden className={cn("inline-flex flex-col items-end leading-none", className)}>
      <span className="font-display text-[15px] font-medium tracking-[0.04em]">
        TRANSFORMATRIX
        <sup className="ml-px text-[8px]">*</sup>
      </span>
      <span className="mt-0.5 font-display text-[6.5px] tracking-[0.18em]">THE SOUL STUDIO</span>
    </span>
  );
}

// Large logo for the footer.
export function FooterWordmark() {
  return (
    <div aria-hidden className="inline-flex flex-col items-end text-white">
      <div className="relative font-display text-[clamp(1.5rem,6.2vw,5.5rem)] leading-none font-normal tracking-[0.02em]">
        TRANSFORMATRIX
        <Asterisk className="absolute -top-[0.28em] -right-[0.42em] size-[0.42em]" />
      </div>
      <p className="mt-1 font-display text-[clamp(0.6rem,2vw,1.75rem)] leading-none tracking-[0.06em]">
        THE SOUL STUDIO
      </p>
    </div>
  );
}
