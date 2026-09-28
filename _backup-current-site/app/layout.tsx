import type { Metadata, Viewport } from "next";
import { display, mono } from "./fonts";
import { SoundProvider } from "@/lib/sound";
import "./globals.css";

// Icons come from the file conventions in app/: favicon.ico, icon.png and
// apple-icon.png, all cut from the supplied logo. The social preview is
// public/og-image.jpg, cut from the supplied design.
export const metadata: Metadata = {
  metadataBase: new URL("https://jorisvrr.com"),

  title: {
    default: "Joris van Rijn — ICT, Business & Digital Product",
    template: "%s — Joris van Rijn",
  },

  description:
    "Portfolio of Joris van Rijn, an HBO-ICT Business & Data Management student focused on digital products, UI/UX, business optimization, data and software development.",

  keywords: [
    "Joris van Rijn",
    "Joris van Rijn portfolio",
    "HBO ICT",
    "Business & Data Management",
    "ICT portfolio",
    "digital product design",
    "UI UX design",
    "business optimization",
    "business process optimization",
    "data analytics",
    "software development",
    "Java",
    "SQL",
    "BPMN",
    "web development",
    "Netherlands",
  ],

  authors: [
    {
      name: "Joris van Rijn",
      url: "https://jorisvrr.com",
    },
  ],

  creator: "Joris van Rijn",
  publisher: "Joris van Rijn",

  alternates: {
    canonical: "https://jorisvrr.com",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jorisvrr.com",
    siteName: "Joris van Rijn",
    title: "Joris van Rijn — ICT, Business & Digital Product",
    description:
      "HBO-ICT Business & Data Management student working across digital products, UI/UX, business optimization, data and software development.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Joris van Rijn — Portfolio",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Joris van Rijn — ICT, Business & Digital Product",
    description:
      "Digital products, UI/UX, business optimization, data and software development.",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
          <main id="main">{children}</main>
        </SoundProvider>
      </body>
    </html>
  );
}
