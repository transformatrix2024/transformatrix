import { formatInTimeZone } from "date-fns-tz";
import type { UpcomingDate } from "@/content/dates";

// Dates on the public site are shown in India time.
export const SITE_TZ = "Asia/Kolkata";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// "2026-11-12" for a moment in time, in India time.
export function dayKey(date: string | Date) {
  return formatInTimeZone(date, SITE_TZ, "yyyy-MM-dd");
}

export function timeLabel(date: string) {
  return formatInTimeZone(date, SITE_TZ, "HH:mm");
}

// Day and month keys are calendar dates, so format them as UTC midnight.
export function dayLabel(key: string, pattern = "EEE, d MMM") {
  return formatInTimeZone(`${key}T00:00:00Z`, "UTC", pattern);
}

export function monthLabel(month: string) {
  return formatInTimeZone(`${month}-01T00:00:00Z`, "UTC", "MMMM yyyy");
}

export function addDays(key: string, n: number) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function shiftMonth(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

export function isMonth(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

// "Thu, 12 Nov · 18:30", or "21–23 Nov" for a multi-day date.
export function whenLabel(date: UpcomingDate) {
  const first = dayKey(date.start);
  const last = date.end ? dayKey(date.end) : first;
  if (first === last) return `${dayLabel(first)} · ${timeLabel(date.start)}`;
  const sameMonth = first.slice(0, 7) === last.slice(0, 7);
  return `${dayLabel(first, sameMonth ? "d" : "d MMM")}–${dayLabel(last, "d MMM")}`;
}

// Day key → dates on that day. A multi-day date appears on every day it runs.
export function datesByDay(dates: UpcomingDate[]) {
  const map = new Map<string, UpcomingDate[]>();
  for (const date of [...dates].sort((a, b) => a.start.localeCompare(b.start))) {
    const last = date.end ? dayKey(date.end) : dayKey(date.start);
    for (let key = dayKey(date.start); key <= last; key = addDays(key, 1)) {
      map.set(key, [...(map.get(key) ?? []), date]);
    }
  }
  return map;
}

// "Online", or "Venue to be announced · Immersion".
export function placeLabel(date: UpcomingDate) {
  return date.place === date.format ? date.place : `${date.place} · ${date.format}`;
}

// Dates that haven't finished yet, soonest first.
export function upcomingOnly(dates: UpcomingDate[], now = new Date()) {
  const today = dayKey(now);
  return dates
    .filter((d) => dayKey(d.end ?? d.start) >= today)
    .sort((a, b) => a.start.localeCompare(b.start));
}

// Monday-first weeks covering a month ("2026-11").
export function monthWeeks(month: string) {
  const [y, m] = month.split("-").map(Number);
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const weeks: { key: string; day: number; inMonth: boolean }[][] = [];
  for (let i = 0; i < cells; i++) {
    const date = new Date(Date.UTC(y, m - 1, 1 - offset + i));
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push({
      key: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === m - 1,
    });
  }
  return weeks;
}
