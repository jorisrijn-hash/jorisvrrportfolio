import type { Metadata, Viewport } from "next";
import { display, mono } from "./fonts";
import { SoundProvider } from "@/lib/sound";
import { CustomCursor } from "@/components/cursor/CustomCursor";
import "./globals.css";

const SITE = "https://jorisvrr.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Joris van Rijn", template: "%s — Joris van Rijn" },
  description:
    "Joris van Rijn — HBO-ICT Business & Data Management. Working between business problems and working solutions: interface design, software, data and process.",
  openGraph: {
    type: "website",
    locale: "en",
    url: SITE,
    siteName: "Joris van Rijn",
    title: "Joris van Rijn",
    description:
      "Working between business problems and working solutions: interface design, software, data and process.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#E8E8E8",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <SoundProvider>
          <a className="skip-link" href="#main">Skip to content</a>
          <CustomCursor />
          <main id="main">{children}</main>
        </SoundProvider>
      </body>
    </html>
  );
}
