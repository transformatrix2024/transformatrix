import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { tlsFor } from "./tls";

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables.",
    );
  }

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error(
      "DATABASE_URL is not a valid URL. If the database password contains @, #, / or :, " +
        "write them as %40, %23, %2F and %3A.",
    );
  }
  const client = postgres(url, {
    // Supabase's transaction pooler (port 6543) doesn't support prepared statements.
    prepare: false,
    ssl: tlsFor(host),
    idle_timeout: 20,
  });
  return drizzle({ client, schema, casing: "snake_case" });
}

type Database = ReturnType<typeof connect>;

// Reuse one connection pool per server instance (and across dev hot reloads).
const globalForDb = globalThis as unknown as { db?: Database };

export function db(): Database {
  globalForDb.db ??= connect();
  return globalForDb.db;
}
