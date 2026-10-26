import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { findByToken, unsubscribeByToken } from "@/lib/unsubscribe";

export const metadata: Metadata = {
  title: "Unsubscribe · Transformatrix",
  robots: { index: false },
};

async function unsubscribe(formData: FormData) {
  "use server";
  await unsubscribeByToken(String(formData.get("token") ?? ""));
  revalidatePath("/newsletter/unsubscribe");
}

// Unsubscribing needs a button press so link scanners in mail apps can't
// unsubscribe people just by opening the link.
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const subscriber = await findByToken(token);

  return (
    <main className="grid min-h-dvh place-items-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md rounded-xl bg-background p-6 text-center shadow-sm ring-1 ring-foreground/10">
        <p className="mb-4 font-semibold tracking-tight">Transformatrix</p>
        {!subscriber ? (
          <>
            <h1 className="text-xl font-semibold">This link doesn&apos;t work</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the unsubscribe link from the bottom of one of our emails.
            </p>
          </>
        ) : subscriber.status === "unsubscribed" ? (
          <>
            <h1 className="text-xl font-semibold">You&apos;re unsubscribed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {subscriber.email} won&apos;t get any more newsletters from us.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Unsubscribe from the newsletter?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {subscriber.email} will stop getting Transformatrix newsletters.
            </p>
            <form action={unsubscribe} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <Button type="submit" size="lg">
                Unsubscribe
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
