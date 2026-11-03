"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { UpcomingDate } from "@/content/dates";
import { cn } from "@/lib/utils";
import {
  WEEKDAYS,
  datesByDay,
  dayKey,
  dayLabel,
  monthLabel,
  monthWeeks,
  placeLabel,
  shiftMonth,
  timeLabel,
  whenLabel,
} from "@/lib/calendar";

// The black dot in the navigation: hover (or tap) for a month calendar of
// upcoming dates.
export function CalendarPopover({ dates, sample }: { dates: UpcomingDate[]; sample: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastPointer = useRef("");

  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  // A short delay lets the pointer travel from the dot into the panel.
  const hideSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <div
      ref={wrapper}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && show()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hideSoon()}
      onBlur={(e) => {
        if (!wrapper.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="Upcoming dates"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onPointerDown={(e) => (lastPointer.current = e.pointerType)}
        onClick={() => {
          // With a mouse the hover already opened it, so a click keeps it
          // open; touch and keyboard toggle.
          setOpen((v) => (lastPointer.current === "mouse" ? true : !v));
          lastPointer.current = "";
        }}
        className="group grid size-8 place-items-center rounded-full focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none"
      >
        <span className="size-5 rounded-full bg-tm-ink transition-transform group-hover:scale-110 group-aria-expanded:scale-110" />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Upcoming dates"
          tabIndex={-1}
          className="fixed inset-x-4 top-20 z-50 outline-none animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-3 sm:w-[380px] sm:origin-top-right"
        >
          <MonthCalendar dates={dates} sample={sample} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function MonthCalendar({
  dates,
  sample,
  onNavigate,
}: {
  dates: UpcomingDate[];
  sample: boolean;
  onNavigate: () => void;
}) {
  const today = dayKey(new Date());
  const byDay = useMemo(() => datesByDay(dates), [dates]);
  // Start on the next day that has something on.
  const nextKey = useMemo(() => [...byDay.keys()].sort().find((k) => k >= today), [byDay, today]);
  const [month, setMonth] = useState((nextKey ?? today).slice(0, 7));
  const [selected, setSelected] = useState(nextKey ?? today);
  const selectedDates = byDay.get(selected) ?? [];
  const nextAfterSelected = [...byDay.keys()].sort().find((k) => k > selected && k >= today);

  function select(key: string) {
    setSelected(key);
    setMonth(key.slice(0, 7));
  }

  // Moving to another month selects its first day with something on.
  function goToMonth(next: string) {
    setMonth(next);
    setSelected([...byDay.keys()].sort().find((k) => k.startsWith(next)) ?? `${next}-01`);
  }

  return (
    <div className="rounded-2xl bg-tm-ink p-4 text-white shadow-2xl ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] tracking-wider text-white/55 uppercase">Upcoming dates</p>
        <div className="flex items-center gap-1">
          <MonthButton label="Previous month" onClick={() => goToMonth(shiftMonth(month, -1))}>
            <ChevronLeft className="size-4" />
          </MonthButton>
          <p className="min-w-30 text-center text-sm font-medium" aria-live="polite">
            {monthLabel(month)}
          </p>
          <MonthButton label="Next month" onClick={() => goToMonth(shiftMonth(month, 1))}>
            <ChevronRight className="size-4" />
          </MonthButton>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <span
            key={w}
            className="rounded-full bg-white/10 py-1 text-center font-mono text-[10px] tracking-wide text-white/70 uppercase"
          >
            {w}
          </span>
        ))}
        {monthWeeks(month)
          .flat()
          .map((cell) => {
            if (!cell.inMonth) return <span key={cell.key} aria-hidden />;
            const count = byDay.get(cell.key)?.length ?? 0;
            const isSelected = cell.key === selected;
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelected(cell.key)}
                aria-pressed={isSelected}
                aria-label={`${dayLabel(cell.key, "EEEE d MMMM")}${count ? `, ${count} ${count === 1 ? "session" : "sessions"}` : ""}`}
                className={cn(
                  "relative grid aspect-square place-items-center rounded-lg text-xs font-medium transition-colors",
                  "bg-white/[0.06] text-white/75 hover:bg-white/15",
                  count > 0 && "bg-white/[0.14] text-white",
                  cell.key < today && "text-white/30",
                  cell.key === today && "ring-1 ring-white/70",
                  isSelected && "bg-white text-tm-ink hover:bg-white",
                )}
              >
                {cell.day}
                {count > 0 && (
                  <span className="absolute bottom-1.5 flex gap-0.5">
                    {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                      <span key={i} className="size-1 rounded-full bg-current" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="font-mono text-[11px] tracking-wider text-white/55 uppercase">
          {dayLabel(selected, "EEEE, d MMMM")}
        </p>
        {selectedDates.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1">
            {selectedDates.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/programs/${d.program}`}
                  onClick={onNavigate}
                  className="flex gap-3 rounded-lg p-2 hover:bg-white/10"
                >
                  <span className="w-11 shrink-0 font-mono text-xs font-semibold">
                    {dayKey(d.start) === selected ? timeLabel(d.start) : "cont."}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm leading-snug font-medium">{d.title}</span>
                    <span className="mt-0.5 block text-xs text-white/55">
                      {d.end ? `${whenLabel(d)} · ` : ""}
                      {placeLabel(d)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-white/55">
            Nothing on this day.{" "}
            {nextAfterSelected && (
              <button type="button" onClick={() => select(nextAfterSelected)} className="text-white underline underline-offset-4">
                Next: {dayLabel(nextAfterSelected)}
              </button>
            )}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs">
        <Link href="/calendar" onClick={onNavigate} className="inline-flex items-center gap-1 font-medium hover:underline">
          All upcoming dates <ArrowRight className="size-3.5" />
        </Link>
        {sample && <span className="font-mono text-[10px] text-white/40 uppercase">Sample dates</span>}
      </div>
    </div>
  );
}

function MonthButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}
