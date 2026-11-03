"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/content/site";
import type { UpcomingDate } from "@/content/dates";
import { cn } from "@/lib/utils";
import { CalendarPopover } from "./calendar-popover";
import { Wordmark } from "./logo";

// One row on every screen, as on desktop: logo, the five sections and the
// calendar dot. On phones the text and gaps scale with the screen width so
// the row still fits.
export function SiteNav({ dates, sampleDates }: { dates: UpcomingDate[]; sampleDates: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="relative z-40">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-x-4">
        <Link href="/" aria-label="Transformatrix home" className="w-fit">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="min-w-0">
          <ul className="flex items-center justify-center gap-[clamp(5px,1.6vw,28px)] overflow-x-auto text-[clamp(9px,2.45vw,14px)] [scrollbar-width:none]">
            {NAV.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "underline-offset-[6px] hover:underline max-sm:underline-offset-4",
                    isActive(item.href) && "underline decoration-1",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="justify-self-end">
          <CalendarPopover dates={dates} sample={sampleDates} />
        </div>
      </div>
    </header>
  );
}
