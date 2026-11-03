import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AET)" },
  { value: "Europe/London", label: "London (UK time)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "UTC", label: "UTC" },
] as const;

export function isTimezone(value: string) {
  return TIMEZONES.some((tz) => tz.value === value);
}

// A `datetime-local` input value ("2026-11-20T18:00") read as a wall-clock
// time in `timezone`.
export function parseLocalDateTime(value: string, timezone: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = fromZonedTime(value, timezone);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toLocalInput(date: Date | null | undefined, timezone: string) {
  return date ? formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm") : "";
}

export function formatDateTime(date: Date | null | undefined, timezone = DEFAULT_TIMEZONE) {
  return date ? formatInTimeZone(date, timezone, "d MMM yyyy, h:mm a") : "—";
}

export function formatDate(date: Date | null | undefined, timezone = DEFAULT_TIMEZONE) {
  return date ? formatInTimeZone(date, timezone, "d MMM yyyy") : "—";
}
