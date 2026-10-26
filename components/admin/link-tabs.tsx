"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// Tabs that are links, so each tab has its own URL. A tab is active when the
// path matches and, if it sets a query param, that param matches too.
export function LinkTabs({
  tabs,
  className,
}: {
  tabs: { href: string; label: React.ReactNode; exact?: boolean }[];
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function isActive(href: string, exact?: boolean) {
    const url = new URL(href, "http://x");
    const pathMatches = exact ? pathname === url.pathname : pathname.startsWith(url.pathname);
    if (!pathMatches) return false;
    for (const [key, value] of url.searchParams) {
      if (searchParams.get(key) !== value) return false;
    }
    // A tab without params is only active when no other tab's param is set.
    if (![...url.searchParams.keys()].length) {
      const otherKeys = tabs.flatMap((t) => [...new URL(t.href, "http://x").searchParams.keys()]);
      return !otherKeys.some((key) => searchParams.has(key));
    }
    return true;
  }

  return (
    <div className={cn("-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}>
      <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-[3px] text-sm">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1 font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                active && "bg-background text-foreground shadow-sm",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
