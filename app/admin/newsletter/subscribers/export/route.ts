import { asc } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { csvResponse } from "@/lib/csv";
import { formatDateTime } from "@/lib/dates";

export async function GET() {
  await requireAdmin();
  const rows = await db().select().from(subscribers).orderBy(asc(subscribers.createdAt));
  return csvResponse("subscribers.csv", [
    ["Email", "Name", "Status", "Source", "Joined", "Unsubscribed"],
    ...rows.map((s) => [
      s.email,
      s.name,
      s.status,
      s.source,
      formatDateTime(s.createdAt),
      s.unsubscribedAt ? formatDateTime(s.unsubscribedAt) : "",
    ]),
  ]);
}
