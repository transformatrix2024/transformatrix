import type { Metadata } from "next";
import { Geist, Geist_Mono, Jost } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
// Stand-in for the logo's geometric lettering until the logo files arrive.
const jost = Jost({ subsets: ["latin"], variable: "--font-jost" });

export const metadata: Metadata = {
  title: { default: "Transformatrix · The Soul Studio", template: "%s · Transformatrix" },
  description:
    "Workshops, trainings, and 1:1 sessions designed to support healing, awareness, and embodied self-leadership.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
