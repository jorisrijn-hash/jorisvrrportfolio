import type { Metadata } from "next";
import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { TextLink } from "@/components/primitives/TextLink";
import { Footer } from "@/components/scenes/Footer";
import { STATUS_LABEL, WORK } from "@/content/work";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected projects and case studies by Joris van Rijn.",
};

export default function WorkPage() {
  return (
    <>
      <Scene tone="ivory" measure="loose" style={{ paddingTop: "clamp(7rem, 20vh, 13rem)" }}>
        <div style={{ paddingInline: "var(--gutter)", marginBottom: "clamp(2rem, 6vh, 3.5rem)" }}>
          <Meta style={{ color: "var(--on-surface-dim)" }}>02 / Work</Meta>
        </div>

        <h1 className="plain__type">
          {WORK.length > 0 ? (
            <MaskReveal>Work</MaskReveal>
          ) : (
            <>
              <MaskReveal>Work in</MaskReveal>
              <MaskReveal delay={0.08}>progress.</MaskReveal>
            </>
          )}
        </h1>

        {WORK.length > 0 ? (
          <div style={{ marginTop: "clamp(3rem, 9vh, 5rem)" }}>
            {WORK.map((entry) => (
              <article key={entry.slug} className="vgrid pos__row" style={{ alignItems: "baseline" }}>
                <Meta className="col-full" style={{ color: "var(--accent)" }}>{entry.year}</Meta>
                <h2 className="lab__title col-full col-1-5">{entry.title}</h2>
                <p className="plain__note col-full col-7-5">{entry.summary}</p>
                <Meta className="col-full" style={{ color: "var(--on-surface-dim)" }}>
                  {STATUS_LABEL[entry.status]}
                </Meta>
              </article>
            ))}
          </div>
        ) : (
          <div className="vgrid" style={{ marginTop: "clamp(2.5rem, 8vh, 4rem)", rowGap: "1.25rem" }}>
            <p className="plain__note col-full col-8-4">
              Case studies are being written — the problem, the decisions, and what
              they changed. I would rather publish two properly than six in outline.
            </p>
            <p className="plain__note col-full col-8-4">
              The Lab documents the work as it happens.
            </p>
            <div className="col-full col-8-4" style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              <TextLink href="/lab">Lab</TextLink>
              <TextLink href="/profile">Profile</TextLink>
            </div>
          </div>
        )}
      </Scene>
      <Footer />
    </>
  );
}
