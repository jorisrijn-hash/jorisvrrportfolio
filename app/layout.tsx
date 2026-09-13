import type { Metadata, Viewport } from "next";
import { display, mono } from "./fonts";
import { SoundProvider } from "@/lib/sound";
import { Nav } from "@/components/chrome/Nav";
import { SiteIntro } from "@/components/chrome/SiteIntro";
import { CustomCursor } from "@/components/chrome/CustomCursor";
import "./globals.css";

const SITE = "https://jorisvrr.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Joris van Rijn",
    template: "%s — Joris van Rijn",
  },
  description:
    "Joris van Rijn works across design, technology and systems — building interfaces, tools and experiments from the Netherlands.",
  openGraph: {
    type: "website",
    locale: "en",
    url: SITE,
    siteName: "Joris van Rijn",
    title: "Joris van Rijn",
    description:
      "Design, technology and systems. Interfaces, tools and experiments from the Netherlands.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F1EDE4" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0A" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <head>
        <noscript>
          <style>{`.jvr-intro{display:none!important}`}</style>
        </noscript>
      </head>
      <body data-tone="ivory">
        <SoundProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <SiteIntro />
          <Nav showProgress />
          <CustomCursor />
          <main id="main">{children}</main>
        </SoundProvider>
      </body>
    </html>
  );
}
