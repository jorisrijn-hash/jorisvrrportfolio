import type { MetadataRoute } from "next";
import { PROJECTS, hasCaseStudy } from "@/content/projects";

/**
 * Only pages that actually exist and actually have something on them: the
 * home page, and a case study for each project that has one. A project whose
 * route redirects is not a page, so it is not listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: "https://jorisvrr.com", lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...PROJECTS.filter((p) => hasCaseStudy(p)).map((p) => ({
      url: `https://jorisvrr.com/work/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
