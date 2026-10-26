"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  MonitorPlay,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/recordings", label: "Recordings", icon: MonitorPlay },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-muted text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <Link
      href="/"
      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <ExternalLink className="size-4" />
      View website
    </Link>
  );

  return (
    <>
      {/* Phones and tablets: top bar with a menu */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <Link href="/admin" className="font-semibold tracking-tight">
          Transformatrix <span className="font-normal text-muted-foreground">admin</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </header>
      {open && (
        <div className="sticky top-14 z-20 border-b bg-background p-3 shadow-sm lg:hidden">
          {nav}
          <div className="mt-2 border-t pt-2">{footer}</div>
        </div>
      )}

      {/* Desktop: fixed sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-background p-4 lg:flex">
        <Link href="/admin" className="mb-6 px-3 pt-1 font-semibold tracking-tight">
          Transformatrix <span className="font-normal text-muted-foreground">admin</span>
        </Link>
        {nav}
        <div className="mt-auto border-t pt-3">{footer}</div>
      </aside>
    </>
  );
}
