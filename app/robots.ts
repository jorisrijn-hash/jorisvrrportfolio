import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://jorisvrr.com/sitemap.xml",
    host: "https://jorisvrr.com",
  };
}
