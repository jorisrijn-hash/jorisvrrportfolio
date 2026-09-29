import type { NextConfig } from "next";

/**
 * Redirects inherited from the previous jorisvrr.com (static NL/EN site).
 * That site ranked on Dutch routes; this replaces it at the root, so every old
 * path is mapped rather than left to 404.
 *
 * The site is ONE page now. It has no /work and no /about — those were states
 * of the previous implementation, and sending an old URL to either of them is
 * a 308 into a 404. Every route below lands on a section of the page that
 * actually exists, by the same anchors the navigation uses.
 */
const legacy = [
  { source: "/lab", destination: "/#work", permanent: true },
  { source: "/profile", destination: "/#about", permanent: true },
  { source: "/contact", destination: "/#contact", permanent: true },
  { source: "/work", destination: "/#work", permanent: true },
  { source: "/about", destination: "/#about", permanent: true },

  // Dutch pages from the previous jorisvrr.com
  { source: "/werk", destination: "/#work", permanent: true },
  { source: "/werkwijze", destination: "/#about", permanent: true },
  { source: "/prijzen", destination: "/#about", permanent: true },
  { source: "/ai", destination: "/#work", permanent: true },

  // English mirror of the old site
  { source: "/en", destination: "/", permanent: true },
  { source: "/en/werk", destination: "/#work", permanent: true },
  { source: "/en/werkwijze", destination: "/#about", permanent: true },
  { source: "/en/prijzen", destination: "/#about", permanent: true },
  { source: "/en/ai", destination: "/#work", permanent: true },
  { source: "/en/contact", destination: "/#contact", permanent: true },

  // Long-dead routes the old vercel.json was already absorbing
  { source: "/movies", destination: "/", permanent: true },
  { source: "/movies/:path*", destination: "/", permanent: true },
  { source: "/photography", destination: "/", permanent: true },
  { source: "/photography/:path*", destination: "/", permanent: true },
  { source: "/films", destination: "/", permanent: true },
  { source: "/film/:path*", destination: "/", permanent: true },
  { source: "/video/:path*", destination: "/", permanent: true },
  { source: "/portfolio/:path*", destination: "/#work", permanent: true },
];

/**
 * Public media is not content-hashed (unlike /_next/static, which Next already
 * serves immutable), so it cannot be cached forever. A day fresh, then a week
 * served from cache while revalidating in the background: repeat visits skip
 * the round-trips, and a replaced file still lands within a day. Vercel's
 * default here was max-age=0, must-revalidate — a request per file per visit.
 */
const MEDIA_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  async redirects() {
    return legacy;
  },
  async headers() {
    return ["/grain.png", "/og-image.jpg", "/portrait-:size.webp", "/work/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: MEDIA_CACHE }],
    }));
  },
};

export default nextConfig;
