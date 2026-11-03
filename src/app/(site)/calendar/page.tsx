import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateList, MonthGrid } from "@/components/site/date-views";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/primitives";
import { FORMATS, UPCOMING_DATES, USING_SAMPLE_DATES } from "@/content/dates";
import { cn } from "@/lib/utils";
import { dayKey, isMonth, monthLabel, shiftMonth, upcomingOnly } from "@/lib/calendar";

export const metadata: Metadata = { title: "Upcoming dates" };

type Params = { view?: string; format?: string; month?: string };

// Every upcoming date as a list or a month grid, filterable by format.
export default async function CalendarPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const view = params.view === "month" ? "month" : "list";
  const format = FORMATS.find((f) => f.toLowerCase() === params.format);
  const dates = UPCOMING_DATES.filter((d) => !format || d.format === format);
  const upcoming = upcomingOnly(dates);
  const today = dayKey(new Date());
  const month = isMonth(params.month) ? params.month : (upcoming[0] ? dayKey(upcoming[0].start) : today).slice(0, 7);

  const href = (next: Params) => {
    const merged = { view: view === "month" ? "month" : undefined, format: format?.toLowerCase(), ...next };
    const query = new URLSearchParams(Object.entries(merged).filter(([, v]) => v) as [string, string][]);
    return query.size ? `/calendar?${query}` : "/calendar";
  };

  return (
    <Container>
      <PageHero
        title="Upcoming dates"
        intro="Workshops, circles, immersions and retreats. Choose a date to see the program and how to join."
      >
        {USING_SAMPLE_DATES && (
          <p className="mt-5 w-fit rounded-full bg-white/70 px-3 py-1 font-mono text-xs">
            Sample dates until the real schedule is published
          </p>
        )}
      </PageHero>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 sm:mt-6 sm:gap-3">
        <div className="flex w-fit rounded-full bg-tm-pill p-1" role="group" aria-label="View">
          {(["list", "month"] as const).map((v) => (
            <Link
              key={v}
              href={href({ view: v === "month" ? "month" : undefined, month: undefined })}
              aria-current={view === v ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1 font-mono text-xs capitalize",
                view === v ? "bg-tm-ink text-white" : "hover:bg-black/5",
              )}
            >
              {v}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by format">
          {[undefined, ...FORMATS].map((f) => (
            <Link
              key={f ?? "all"}
              href={href({ format: f?.toLowerCase() })}
              aria-current={format === f ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-1 font-mono text-xs",
                format === f ? "bg-tm-ink text-white" : "bg-tm-pill hover:bg-black/10",
              )}
            >
              {f ?? "All formats"}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {view === "list" ? (
          <DateList dates={upcoming} empty="No upcoming dates in this format yet." />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium">{monthLabel(month)}</h2>
              <div className="flex gap-1">
                <Link
                  href={href({ month: shiftMonth(month, -1) })}
                  aria-label="Previous month"
                  className="grid size-9 place-items-center rounded-full bg-tm-pill hover:bg-black/10"
                >
                  <ChevronLeft className="size-4" />
                </Link>
                <Link
                  href={href({ month: shiftMonth(month, 1) })}
                  aria-label="Next month"
                  className="grid size-9 place-items-center rounded-full bg-tm-pill hover:bg-black/10"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
            <MonthGrid month={month} dates={dates} today={today} />
          </>
        )}
      </div>
    </Container>
  );
}
