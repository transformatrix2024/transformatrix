import Link from "next/link";
import type { UpcomingDate } from "@/content/dates";
import { getProgram } from "@/content/programs";
import { cn } from "@/lib/utils";
import {
  WEEKDAYS,
  datesByDay,
  dayKey,
  dayLabel,
  monthLabel,
  monthWeeks,
  placeLabel,
  timeLabel,
  whenLabel,
} from "@/lib/calendar";

// Upcoming dates as a list, grouped by month.
export function DateList({
  dates,
  empty,
  linkToProgram = true,
}: {
  dates: UpcomingDate[];
  empty?: string;
  // Off on a program's own page, where the link would point back to itself.
  linkToProgram?: boolean;
}) {
  if (dates.length === 0) {
    return <p className="rounded-lg bg-tm-soft p-6 text-sm text-black/60">{empty ?? "No dates announced yet."}</p>;
  }

  const months = new Map<string, UpcomingDate[]>();
  for (const d of dates) {
    const month = dayKey(d.start).slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), d]);
  }

  return (
    <div className="flex flex-col gap-10">
      {[...months].map(([month, items]) => (
        <section key={month}>
          <h3 className="font-mono text-xs tracking-wider text-black/60 uppercase">{monthLabel(month)}</h3>
          <ul className="mt-3 divide-y divide-black/10 border-y border-black/10">
            {items.map((d) => (
              <li key={d.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2 py-3 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-4 sm:py-4">
                <div className="text-center">
                  <p className="text-lg leading-none font-medium sm:text-2xl">{dayLabel(dayKey(d.start), "d")}</p>
                  <p className="mt-1 font-mono text-[10px] text-black/55 uppercase">{dayLabel(dayKey(d.start), "EEE")}</p>
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold">{d.end ? whenLabel(d) : timeLabel(d.start)}</p>
                  <p className="mt-0.5 text-xs font-medium sm:text-[15px]">{d.title}</p>
                  <p className="mt-0.5 text-[11px] text-black/60 sm:text-sm">{placeLabel(d)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                  {linkToProgram && (
                    <Link
                      href={`/programs/${d.program}`}
                      className="rounded-md bg-tm-ink px-2 py-1 font-mono text-[10px] whitespace-nowrap text-white hover:bg-black/75 sm:px-3 sm:py-1.5 sm:text-xs"
                    >
                      {getProgram(d.program) ? "View program" : "Details"}
                    </Link>
                  )}
                  <span className="text-right font-mono text-[9px] text-black/45 uppercase sm:text-[10px]">Enrolment opens soon</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// A full month grid with the dates written into each day.
export function MonthGrid({ month, dates, today }: { month: string; dates: UpcomingDate[]; today: string }) {
  const byDay = datesByDay(dates);
  return (
    <div className="overflow-hidden rounded-lg border border-black/10">
      <div className="grid grid-cols-7 border-b border-black/10 bg-tm-soft">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-2 text-center font-mono text-[11px] tracking-wide text-black/60 uppercase">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthWeeks(month)
          .flat()
          .map((cell) => {
            const items = cell.inMonth ? (byDay.get(cell.key) ?? []) : [];
            return (
              <div
                key={cell.key}
                className={cn(
                  "min-h-16 border-r border-b border-black/10 p-1.5 sm:min-h-28 sm:p-2 [&:nth-child(7n)]:border-r-0",
                  !cell.inMonth && "bg-black/[0.02]",
                )}
              >
                {cell.inMonth && (
                  <>
                    <span
                      className={cn(
                        "grid size-6 place-items-center rounded-full text-xs font-medium",
                        cell.key === today && "bg-tm-ink text-white",
                        cell.key < today && "text-black/35",
                      )}
                    >
                      {cell.day}
                    </span>
                    <ul className="mt-1 flex flex-col gap-1">
                      {items.map((d) => (
                        <li key={d.id}>
                          <Link
                            href={`/programs/${d.program}`}
                            title={d.title}
                            className="block rounded bg-tm-ink px-1.5 py-1 text-[10px] leading-tight text-white hover:bg-black/75 sm:text-[11px]"
                          >
                            <span className="hidden font-mono sm:inline">
                              {dayKey(d.start) === cell.key ? `${timeLabel(d.start)} ` : ""}
                            </span>
                            <span className="line-clamp-2 sm:line-clamp-1">{d.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
