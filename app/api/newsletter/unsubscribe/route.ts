import { unsubscribeByToken } from "@/lib/unsubscribe";

// One-click unsubscribe (RFC 8058): Gmail and Yahoo POST here when someone
// presses "Unsubscribe" next to the sender name.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  await unsubscribeByToken(token);
  // Always 200 so the token can't be probed.
  return new Response(null, { status: 200 });
}
