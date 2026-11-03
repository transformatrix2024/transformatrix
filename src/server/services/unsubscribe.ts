import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { subscribers } from "@/server/db/schema";
import { isUuid } from "@/lib/ids";

export async function findByToken(token: string | undefined) {
  if (!token || !isUuid(token)) return undefined;
  return db().query.subscribers.findFirst({ where: eq(subscribers.unsubscribeToken, token) });
}

export async function unsubscribeByToken(token: string) {
  if (!isUuid(token)) return false;
  const rows = await db()
    .update(subscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(and(eq(subscribers.unsubscribeToken, token), eq(subscribers.status, "subscribed")))
    .returning({ id: subscribers.id });
  return rows.length > 0;
}
