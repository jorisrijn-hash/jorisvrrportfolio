import type { Metadata } from "next";
import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { TextLink } from "@/components/primitives/TextLink";
import { LabGlyph } from "@/components/primitives/LabGlyph";
import { Footer } from "@/components/scenes/Footer";
import { KIND_LABEL, LAB, LAB_TRACKS } from "@/content/lab";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Experiments, motion studies, graphics and small tools — documented as they are built.",
};

export default function LabPage() {
  const live = LAB.length > 0;

  return (
    <>
      <Scene tone="ink" measure="loose" style={{ paddingTop: "clamp(7rem, 20vh, 13rem)" }}>
        <div style={{ paddingInline: "var(--gutter)", marginBottom: "clamp(2rem, 6vh, 3.5rem)" }}>
          <Meta style={{ color: "var(--on-surface-dim)" }}>03 / Lab</Meta>
        </div>

        <h1 className="plain__type">
          <MaskReveal>A working</MaskReveal>
          <MaskReveal delay={0.08}>record.</MaskReveal>
        </h1>

        <div className="vgrid" style={{ marginTop: "clamp(2rem, 6vh, 3rem)" }}>
          <p className="plain__note col-full col-8-4">
            Interaction work, motion studies, generative graphics, data pieces and
            things written outside the browser. Smaller than a case study, and kept
            honest — including the ones that did not work.
          </p>
        </div>

        <div
          className="vgrid"
          style={{ marginTop: "clamp(3rem, 10vh, 6rem)", rowGap: "clamp(2rem, 6vh, 3.5rem)" }}
        >
          {(live
            ? LAB.map((e, i) => ({ key: e.slug, index: e.index, title: e.title, meta: `${KIND_LABEL[e.kind]} — ${e.year}`, body: e.summary, seed: i }))
            : LAB_TRACKS.map((t, i) => ({ key: t.index, index: t.index, title: t.title, meta: "Open", body: "", seed: i }))
          ).map((item) => (
            <article key={item.key} className="lab__item col-full col-1-5" style={{ width: "auto" }}>
              <Meta style={{ color: "var(--accent)" }}>{item.index}</Meta>
              <h2 className="lab__title">{item.title}</h2>
              <Meta style={{ color: "var(--on-surface-dim)" }}>{item.meta}</Meta>
              {item.body ? <p className="plain__note">{item.body}</p> : null}
              <div className="lab__glyph"><LabGlyph seed={item.seed} /></div>
            </article>
          ))}
        </div>

        {!live ? (
          <div className="vgrid" style={{ marginTop: "clamp(2.5rem, 8vh, 4rem)" }}>
            <p className="plain__note col-full col-8-4">
              First entries land shortly. Publishing one is a matter of writing it —
              the page is built to grow.
            </p>
            <div className="col-full col-8-4" style={{ marginTop: "1rem" }}>
              <TextLink href="/contact">Get in touch</TextLink>
            </div>
          </div>
        ) : null}
      </Scene>
      <Footer />
    </>
  );
}
