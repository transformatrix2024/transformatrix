import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { isUuid } from "./ids";

// Cached per request, so an event's layout and page share one query.
export const getEvent = cache(async (id: string) => {
  if (!isUuid(id)) return undefined;
  return db().query.events.findFirst({ where: eq(events.id, id) });
});

export function eventPlace(event: { venueName: string | null; onlineUrl: string | null }) {
  if (event.venueName && event.onlineUrl) return `${event.venueName} + online`;
  return event.venueName ?? (event.onlineUrl ? "Online" : null);
}
