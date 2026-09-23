import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PROJECTS, PROJECT_BY_SLUG, hasCaseStudy } from "@/content/projects";
import { CaseRoute } from "@/components/case/CaseRoute";

/**
 * /work/[slug] — a real route per project, not a component swapped behind a
 * fixed URL. Opening a case study from inside the environment moves the URL
 * here without a reload; arriving at it directly renders the same case study
 * with a shortened arrival.
 *
 * A project whose case study does not exist yet does not get an empty page
 * pretending otherwise: it returns to the Work index, where its real state
 * (in preparation, or coming soon) is on screen.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECT_BY_SLUG[slug];
  if (!p || !hasCaseStudy(p)) return { title: "Work", robots: { index: false, follow: true } };

  // Only what the project actually says about itself.
  const title = p.seo?.title ?? `${p.title} — Case study`;
  const description = p.seo?.description ?? p.context?.[0] ?? `${p.type}${p.role?.length ? ` · ${p.role.join(" / ")}` : ""}`;
  // A generated stand-in is never used as a social preview.
  const image = p.openGraph?.image ?? (p.heroMedia && !p.heroMedia.isPlaceholder ? p.heroMedia.src : undefined);

  return {
    title,
    description,
    alternates: { canonical: `/work/${p.slug}` },
    // Development case studies exist to test the sections, not to be indexed.
    robots: p.devOnly ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: p.openGraph?.title ?? title,
      description: p.openGraph?.description ?? description,
      url: `/work/${p.slug}`,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PROJECT_BY_SLUG[slug];
  if (!p) notFound();
  if (!hasCaseStudy(p)) redirect("/");
  return <CaseRoute slug={slug} />;
}
