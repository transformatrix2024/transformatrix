"use client";

import { Children, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const STEP_MS = 3500;
const RESUME_AFTER_MS = 5000;

// On phones: a row that moves on by one card every few seconds and loops
// forever. Swiping still works and pauses it for a moment; it stays still for
// people who prefer reduced motion. From the sm breakpoint up the cards sit
// side by side in a grid and nothing moves.
export function AutoScrollRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const row = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const phone = window.matchMedia("(max-width: 639px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pausedUntil = 0;
    const pause = () => {
      pausedUntil = Date.now() + RESUME_AFTER_MS;
    };

    const timer = setInterval(() => {
      if (!phone.matches || reducedMotion.matches || document.hidden || Date.now() < pausedUntil) return;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const stride = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
      const loop = stride * items.length;
      // Once on the copies, jump back one loop; they look identical, so the
      // jump can't be seen and the row never runs out.
      if (el.scrollLeft >= loop - 1) el.scrollLeft -= loop;
      el.scrollTo({ left: el.scrollLeft + stride, behavior: "smooth" });
    }, STEP_MS);

    el.addEventListener("pointerdown", pause);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("focusin", pause);
    return () => {
      clearInterval(timer);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("focusin", pause);
    };
  }, [items.length]);

  return (
    <div
      ref={row}
      className={cn(
        "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 [scrollbar-width:none]",
        "*:w-[78%] *:shrink-0 *:snap-start [&>*>*]:h-full",
        "sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:*:w-auto",
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i}>{item}</div>
      ))}
      {/* Copies that make the loop seamless; hidden from screen readers and keyboards. */}
      {items.map((item, i) => (
        <div key={`copy-${i}`} aria-hidden inert className="sm:hidden">
          {item}
        </div>
      ))}
    </div>
  );
}
