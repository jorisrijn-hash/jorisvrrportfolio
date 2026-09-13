"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { TextLink } from "@/components/primitives/TextLink";
import { LabGlyph } from "@/components/primitives/LabGlyph";
import { useReducedMotion } from "@/lib/motion";
import { KIND_LABEL, LAB, LAB_TRACKS } from "@/content/lab";

/**
 * SCENE 06 — LAB
 *
 * The strategically important scene while the portfolio fills up, so it gets
 * the strongest interaction: a full-bleed horizontal track that moves against
 * vertical scroll. Entries are graphic objects — generated geometry keyed to
 * each entry — not cards.
 *
 * Until LAB has entries this shows the standing territories rather than
 * inventing projects. The moment LAB fills, real entries replace them.
 */
export function Lab() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // Spring a NUMBER, then format. Springing a percentage string produces
  // invalid keyframes and takes the whole page down on hydration.
  const raw = useTransform(scrollYProgress, [0, 1], [6, -26]);
  const smooth = useSpring(raw, { stiffness: 55, damping: 22 });
  const x = useTransform(smooth, (v) => `${v}%`);

  const live = LAB.length > 0;
  const items = live
    ? LAB.map((e) => ({ index: e.index, title: e.title, meta: `${KIND_LABEL[e.kind]} — ${e.year}` }))
    : LAB_TRACKS.map((t) => ({ index: t.index, title: t.title, meta: "Open" }));

  return (
    <Scene tone="ink" measure="normal" className="lab" as="section">
      <div ref={ref as never} style={{ display: "contents" }} />

      <div style={{ paddingInline: "var(--gutter)", marginBottom: "clamp(2rem, 6vh, 3.5rem)" }}>
        <Meta style={{ color: "var(--on-surface-dim)" }}>06 / Lab</Meta>
      </div>

      <h2 className="plain__type" style={{ marginBottom: "clamp(2.5rem, 8vh, 4.5rem)" }}>
        <MaskReveal>A working</MaskReveal>
        <MaskReveal delay={0.08}>record.</MaskReveal>
      </h2>

      <motion.div className="lab__track" style={reduced ? undefined : { x }}>
        {items.map((item, i) => (
          <article key={item.index} className="lab__item">
            <Meta style={{ color: "var(--accent)" }}>{item.index}</Meta>
            <h3 className="lab__title">{item.title}</h3>
            <Meta style={{ color: "var(--on-surface-dim)" }}>{item.meta}</Meta>
            <div className="lab__glyph">
              <LabGlyph seed={i} />
            </div>
          </article>
        ))}
      </motion.div>

      <div style={{ paddingInline: "var(--gutter)", marginTop: "clamp(2.5rem, 7vh, 4rem)" }}>
        <TextLink href="/lab">{live ? "All experiments" : "About the Lab"}</TextLink>
      </div>
    </Scene>
  );
}
