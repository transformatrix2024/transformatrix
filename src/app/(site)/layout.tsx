import type { Viewport } from "next";
import { SiteFooter } from "@/components/site/site-footer";

// The client wants every device to show the exact desktop layout. Phones and
// tablets render the page 1280px wide and shrink it to fit the screen
// (pinch-zoom still works). Remove this to get the responsive phone layouts,
// which are still in the components (sm:/md:/lg: classes, auto-scroll row).
// initialScale must be cleared: Next.js adds initial-scale=1 by default, which
// would show the page at full size instead of fitting it to the screen.
export const viewport: Viewport = { width: 1280, initialScale: undefined };

// Public website: every page starts with its own hero card (which holds the
// navigation) and ends with the shared footer.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-tm-ink">
      <main className="flex-1 pt-4 sm:pt-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
