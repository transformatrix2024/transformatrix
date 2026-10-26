import { headers } from "next/headers";
import { checkAdminAuth } from "./admin-auth";

// proxy.ts guards every /admin request, but Server Actions can be reached
// outside it, so each admin page and action also calls this.
export async function requireAdmin() {
  const authorization = (await headers()).get("authorization");
  if (checkAdminAuth(authorization) !== "ok") {
    throw new Error("Not authorised");
  }
}
