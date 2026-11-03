import { createHash, timingSafeEqual } from "node:crypto";

export type AdminAuthResult = "ok" | "denied" | "not-configured";

// Temporary lock for /admin until real login exists: the browser asks for a
// password (HTTP Basic auth) and we compare it with ADMIN_PASSWORD. Any
// username works. Without ADMIN_PASSWORD the admin stays locked in
// production and open in local development.
export function checkAdminAuth(authorization: string | null): AdminAuthResult {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return process.env.NODE_ENV === "production" ? "not-configured" : "ok";
  }
  if (!authorization?.startsWith("Basic ")) return "denied";

  const decoded = Buffer.from(authorization.slice("Basic ".length), "base64").toString("utf8");
  const given = decoded.slice(decoded.indexOf(":") + 1);
  return sameSecret(given, password) ? "ok" : "denied";
}

function sameSecret(a: string, b: string) {
  // Hash first so the comparison takes the same time whatever the lengths.
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}
