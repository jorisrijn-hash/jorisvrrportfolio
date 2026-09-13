import type { NextConfig } from "next";

/**
 * Redirects inherited from the previous jorisvrr.com (static NL/EN site).
 * That site ranked on Dutch routes; this replaces it at the root, so every old
 * path is mapped rather than left to 404.
 */
const legacy = [
  // The experience is a state machine at "/" with deep links at /work and
  // /about. Everything that used to be its own page now resolves to a state.
  { source: "/lab", destination: "/work", permanent: true },
  { source: "/profile", destination: "/about", permanent: true },
  { source: "/contact", destination: "/about", permanent: true },

  // Dutch pages from the previous jorisvrr.com
  { source: "/werk", destination: "/work", permanent: true },
  { source: "/werkwijze", destination: "/about", permanent: true },
  { source: "/prijzen", destination: "/about", permanent: true },
  { source: "/ai", destination: "/work", permanent: true },

  // English mirror of the old site
  { source: "/en", destination: "/", permanent: true },
  { source: "/en/werk", destination: "/work", permanent: true },
  { source: "/en/werkwijze", destination: "/about", permanent: true },
  { source: "/en/prijzen", destination: "/about", permanent: true },
  { source: "/en/ai", destination: "/work", permanent: true },
  { source: "/en/contact", destination: "/about", permanent: true },

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
