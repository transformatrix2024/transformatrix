import Link from "next/link";
import { FOOTER_LINKS } from "@/content/site";
import { FooterWordmark } from "./logo";
import { Container } from "./primitives";

export function SiteFooter() {
  return (
    <footer className="mt-28 bg-tm-night text-white">
      <Container className="flex flex-col gap-10 py-14 sm:flex-row sm:items-end sm:justify-between sm:py-20">
        <Link href="/" aria-label="Transformatrix home" className="w-fit">
          <FooterWordmark />
        </Link>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/85 sm:flex-col">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-wrap justify-between gap-2 py-4 text-xs text-white/50">
          <span>© {new Date().getFullYear()} Transformatrix · The Soul Studio</span>
          <span>Powered By Mendly</span>
        </Container>
      </div>
    </footer>
  );
}
