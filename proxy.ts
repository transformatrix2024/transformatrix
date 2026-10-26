import { NextResponse, type NextRequest } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

export function proxy(request: NextRequest) {
  const result = checkAdminAuth(request.headers.get("authorization"));
  if (result === "ok") return NextResponse.next();

  if (result === "not-configured") {
    return new NextResponse(
      "The admin is locked. Set ADMIN_PASSWORD in Vercel → Settings → Environment Variables, then redeploy.",
      { status: 503 },
    );
  }
  return new NextResponse("Enter the admin password to continue.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Transformatrix admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
