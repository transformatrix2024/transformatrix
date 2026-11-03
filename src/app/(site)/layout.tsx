import { SiteFooter } from "@/components/site/site-footer";

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
