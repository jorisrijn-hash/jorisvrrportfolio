import type { NextConfig } from "next";

/**
 * Redirects inherited from the previous jorisvrr.com (static NL/EN site).
 * That site ranked on Dutch routes; this portfolio replaces it at the root,
 * so every old path is mapped rather than left to 404.
 *
 * Deliberately NOT carried over from the old vercel.json:
 *   /work/:path* -> /   — `/work/[slug]` is a real route here now.
 */
const legacy = [
  // Dutch pages -> nearest equivalent
  { source: "/werk", destination: "/work", permanent: true },
  { source: "/werkwijze", destination: "/profile", permanent: true },
  { source: "/prijzen", destination: "/contact", permanent: true },
  { source: "/ai", destination: "/lab", permanent: true },

  // English mirror of the old site
  { source: "/en", destination: "/", permanent: true },
  { source: "/en/werk", destination: "/work", permanent: true },
  { source: "/en/werkwijze", destination: "/profile", permanent: true },
  { source: "/en/prijzen", destination: "/contact", permanent: true },
  { source: "/en/ai", destination: "/lab", permanent: true },
  { source: "/en/contact", destination: "/contact", permanent: true },

  // Long-dead routes the old vercel.json was already absorbing
  { source: "/movies", destination: "/", permanent: true },
  { source: "/movies/:path*", destination: "/", permanent: true },
  { source: "/photography", destination: "/", permanent: true },
  { source: "/photography/:path*", destination: "/", permanent: true },
  { source: "/films", destination: "/", permanent: true },
  { source: "/film/:path*", destination: "/", permanent: true },
  { source: "/video/:path*", destination: "/", permanent: true },
  { source: "/portfolio/:path*", destination: "/work", permanent: true },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  async redirects() {
    return legacy;
  },
};

export default nextConfig;
