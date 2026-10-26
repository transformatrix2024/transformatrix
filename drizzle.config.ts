import { defineConfig } from "drizzle-kit";
import { tlsFor } from "./db/tls";

// `drizzle-kit migrate` runs against DIRECT_URL (Supabase session pooler,
// port 5432); the app itself uses DATABASE_URL (transaction pooler, port 6543).
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

// Split the URL into parts so the connection can verify Supabase's certificate.
function credentials(raw: string) {
  const u = new URL(raw);
  return {
    host: u.hostname,
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1) || "postgres",
    ssl: tlsFor(u.hostname),
  };
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  casing: "snake_case",
  dbCredentials: url ? credentials(url) : { url: "" },
});
