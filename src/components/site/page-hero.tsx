import Link from "next/link";
import { Fragment } from "react";
import { UPCOMING_DATES, USING_SAMPLE_DATES } from "@/content/dates";
import { cn } from "@/lib/utils";
import { SiteNav } from "./site-nav";

// Navigation for pages whose hero is their own (the landing page).
export function Nav() {
  return <SiteNav dates={UPCOMING_DATES} sampleDates={USING_SAMPLE_DATES} />;
}

// Grey header card with the navigation, used at the top of every inner page.
export function PageHero({
  title,
  intro,
  crumbs,
  className,
  children,
}: {
  title: React.ReactNode;
  intro?: React.ReactNode;
  crumbs?: { href: string; label: string }[];
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg bg-tm-card p-4 sm:p-6", className)}>
      <Nav />
      <div className="mt-16 max-w-2xl sm:mt-24">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-3 font-mono text-xs text-black/60">
            {crumbs.map((c) => (
              <Fragment key={c.href}>
                <Link href={c.href} className="hover:text-black hover:underline">
                  {c.label}
                </Link>
                <span className="mx-1.5">/</span>
              </Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.08] font-medium tracking-tight">{title}</h1>
        {intro && <div className="mt-4 max-w-xl text-[15px] leading-relaxed text-black/70">{intro}</div>}
        {children}
      </div>
    </section>
  );
}
