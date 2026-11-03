"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/content/site";
import type { UpcomingDate } from "@/content/dates";
import { cn } from "@/lib/utils";
import { CalendarPopover } from "./calendar-popover";
import { Wordmark } from "./logo";

// The same navigation on every screen: logo, the five sections and the
// calendar dot. On phones the links move to a second row so they stay
// visible (no hidden menu).
export function SiteNav({ dates, sampleDates }: { dates: UpcomingDate[]; sampleDates: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="relative z-40">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 sm:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label="Transformatrix home" className="w-fit">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="order-last col-span-2 sm:order-none sm:col-span-1">
          <ul className="flex items-center justify-between gap-3 overflow-x-auto text-[13px] [scrollbar-width:none] sm:justify-center sm:gap-6 sm:text-sm lg:gap-7">
            {NAV.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "underline-offset-[6px] hover:underline",
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
