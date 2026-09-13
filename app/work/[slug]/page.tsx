import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { ArrowLink } from "@/components/primitives/ArrowLink";
import { Footer } from "@/components/modules/Footer";
import { STATUS_LABEL, WORK, getWork } from "@/content/work";

type Params = { params: Promise<{ slug: string }> };

/** Pre-renders every published project. Empty registry = no routes, no 404s. */
export function generateStaticParams() {
  return WORK.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = getWork(slug);
  if (!entry) return { title: "Not found" };
  return { title: entry.title, description: entry.summary };
}

export default async function WorkEntryPage({ params }: Params) {
  const { slug } = await params;
  const entry = getWork(slug);
  if (!entry) notFound();

  return (
    <>
      <Section tone="ivory" className="u-page" style={{ paddingTop: "clamp(7rem, 18vh, 12rem)" }}>
        <SectionLabel index="02">
          {STATUS_LABEL[entry.status]} — {entry.year}
        </SectionLabel>

        <h1
          className="jvr-empty__title"
          style={{ marginTop: "clamp(2rem, 6vh, 3.5rem)", fontSize: "var(--text-display-l)" }}
        >
          <MaskReveal>{entry.title}</MaskReveal>
        </h1>

        <p className="jvr-hero__statement" style={{ marginTop: "2rem" }}>
          {entry.summary}
        </p>

        <p className="u-micro" style={{ marginTop: "1.5rem", color: "var(--on-surface-dim)" }}>
          {entry.disciplines.join(" / ")}
        </p>
      </Section>

      {entry.body && entry.body.length > 0 ? (
        <Section tone="ivory" className="u-page" style={{ paddingTop: 0 }}>
          <div className="jvr-profile__bio">
            {entry.body.map((p, i) => (
              <p key={i}>
                <MaskReveal delay={i * 0.06}>{p}</MaskReveal>
              </p>
            ))}
          </div>
        </Section>
      ) : null}

      <Section tone="ivory" className="u-page" style={{ paddingTop: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem 2.5rem" }}>
          <ArrowLink href="/work">All work</ArrowLink>
          {entry.href ? (
            <ArrowLink href={entry.href} external>
              Visit
            </ArrowLink>
          ) : null}
        </div>
      </Section>
      <Footer />
    </>
  );
}
