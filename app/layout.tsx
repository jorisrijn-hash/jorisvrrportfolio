import type { Metadata, Viewport } from "next";
import { SITE } from "@/content/site";
import { display, mono, sans } from "./fonts";
import "./globals.css";

// Icons come from the file conventions in app/: favicon.ico, icon.png and
// apple-icon.png, all cut from the supplied logo. The social preview is
// public/og-image.jpg, cut from the supplied design.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),

  title: {
    default: "Joris van Rijn · Software Engineering & Automations",
    template: "%s · Joris van Rijn",
  },

  description:
    "Portfolio of Joris van Rijn, an HBO-ICT software engineering student building software, automations and digital products: full-stack and backend development, APIs, data, and the business thinking around them. Open for work.",

  keywords: [
    "Joris van Rijn",
    "software engineering",
    "full-stack development",
    "backend development",
    "automation",
    "HBO-ICT",
    "portfolio",
  ],

  authors: [
    {
      name: "Joris van Rijn",
      url: SITE.origin,
    },
  ],

  creator: "Joris van Rijn",
  publisher: "Joris van Rijn",

  alternates: {
    canonical: SITE.origin,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.origin,
    siteName: "Joris van Rijn",
    title: "Joris van Rijn · Software Engineering & Automations",
    description:
      "Software, automations and digital products: full-stack and backend development, APIs, data, and the business thinking around them. Open for work.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Joris van Rijn, portfolio",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Joris van Rijn · Software Engineering & Automations",
    description:
      "Software, automations and digital products. Full-stack and backend development, APIs and data. Open for work.",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f1ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a09" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        {/* Nothing here that is not already on the page. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Joris van Rijn",
              url: SITE.origin,
              email: "mailto:jorisvrr@gmail.com",
              jobTitle: "Software engineering student",
              description: "HBO-ICT software engineering student building software, automations and digital products. Open for work.",
              address: { "@type": "PostalAddress", addressLocality: "Leiderdorp", addressCountry: "NL" },
              knowsAbout: [
                "Software engineering",
                "Full-stack development",
                "Backend development",
                "Automation",
                "Digital product development",
                "Data",
              ],
              sameAs: [
                "https://www.linkedin.com/in/jorisvnrijn/",
                "https://www.instagram.com/jorisvrr",
              ],
            }),
          }}
        />
        <a className="skip-link" href="#about">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
