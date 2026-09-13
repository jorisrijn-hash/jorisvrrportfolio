import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { TextLink } from "@/components/primitives/TextLink";
import { Footer } from "@/components/scenes/Footer";
import { STATUS_LABEL, WORK, getWork } from "@/content/work";

type Params = { params: Promise<{ slug: string }> };

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
      <Scene tone="ivory" measure="normal" style={{ paddingTop: "clamp(7rem, 20vh, 13rem)" }}>
        <div style={{ paddingInline: "var(--gutter)", marginBottom: "clamp(2rem, 6vh, 3.5rem)" }}>
          <Meta style={{ color: "var(--on-surface-dim)" }}>
            {STATUS_LABEL[entry.status]} — {entry.year}
          </Meta>
        </div>

        <h1 className="plain__type">
          <MaskReveal>{entry.title}</MaskReveal>
        </h1>

        <div className="vgrid" style={{ marginTop: "clamp(2.5rem, 8vh, 4rem)", rowGap: "1.5rem" }}>
          <p className="col-full col-1-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "var(--text-s)", lineHeight: 1.3 }}>
            {entry.summary}
          </p>
          <Meta className="col-full col-9-4" style={{ color: "var(--on-surface-dim)" }}>
            {entry.disciplines.join(" / ")}
          </Meta>
        </div>
      </Scene>

      {entry.body?.length ? (
        <Scene tone="ivory" measure="tight">
          <div className="vgrid">
            <div className="bio col-full col-4-6">
              {entry.body.map((p, i) => (
                <p key={i}><MaskReveal delay={i * 0.05}>{p}</MaskReveal></p>
              ))}
            </div>
          </div>
        </Scene>
      ) : null}

      <Scene tone="ivory" measure="tight">
        <div style={{ paddingInline: "var(--gutter)", display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
          <TextLink href="/work">All work</TextLink>
          {entry.href ? <TextLink href={entry.href} external>Visit</TextLink> : null}
        </div>
      </Scene>
      <Footer />
    </>
  );
}
