"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { useReducedMotion } from "@/lib/motion";
import { CURRENTLY } from "@/content/site";

/**
 * SCENE 04 — CURRENTLY (sticky transformation)
 *
 * One full-width composition, not three cards. The scene is tall; a sticky
 * stage holds the viewport while BUILDING / LEARNING / EXPLORING swap in place
 * against scroll progress — each word rises as the previous one leaves.
 *
 * The same mechanism is what /work will use for sticky case-study presentation
 * later, which is why the layer maths lives here rather than in the markup.
 */
export function Currently() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  if (reduced) {
    // Static fallback: every group stated plainly, still full-bleed.
    return (
      <Scene tone="ink" measure="normal">
        <div style={{ paddingInline: "var(--gutter)", marginBottom: "2rem" }}>
          <Meta style={{ color: "var(--on-surface-dim)" }}>04 / Currently</Meta>
        </div>
        {CURRENTLY.map((g) => (
          <div key={g.label} style={{ paddingInline: "var(--gutter)", marginBottom: "3rem" }}>
            <p className="now__word" style={{ fontWeight: 100 }}>{g.label}</p>
            <div className="now__items" style={{ marginTop: "1rem" }}>
              {g.items.map((it) => <p key={it}>{it}</p>)}
            </div>
          </div>
        ))}
      </Scene>
    );
  }

  return (
    <Scene tone="ink" measure="none" className="now">
      {/* Height drives the sequence: one viewport of scroll per group. */}
      <div ref={ref} style={{ height: `${CURRENTLY.length * 100}svh` }}>
        <div className="now__stage">
          <div style={{ position: "absolute", top: "clamp(4.5rem,11vh,7rem)", left: "var(--gutter)" }}>
            <Meta style={{ color: "var(--on-surface-dim)" }}>04 / Currently</Meta>
          </div>

          {CURRENTLY.map((group, i) => (
            <Layer
              key={group.label}
              progress={scrollYProgress}
              index={i}
              count={CURRENTLY.length}
              label={group.label}
              items={group.items}
            />
          ))}
        </div>
      </div>
    </Scene>
  );
}

function Layer({
  progress,
  index,
  count,
  label,
  items,
}: {
  progress: MotionValue<number>;
  index: number;
  count: number;
  label: string;
  items: string[];
}) {
  const span = 1 / count;
  const start = index * span;
  const end = start + span;
  const edge = span * 0.22;

  const isFirst = index === 0;
  const isLast = index === count - 1;

  // Hand-over windows. The first word is already on screen when the sequence
  // opens; the last stays until it closes.
  const inA = start - edge;
  const inB = start + edge * 0.6;
  const outA = end - edge;
  const outB = end + edge * 0.4;

  /**
   * Presence 0..1 as a piecewise function of scroll progress.
   *
   * Deliberately a function transform, not useTransform's array form: the
   * array form needs a strictly increasing input range, and the pinned edges
   * here produce constant leading/trailing segments that it interpolates
   * unpredictably (the first layer would flicker back in at the end).
   */
  const presence = (v: number) => {
    if (!isFirst) {
      if (v <= inA) return 0;
      if (v < inB) return (v - inA) / (inB - inA);
    }
    if (!isLast) {
      if (v >= outB) return 0;
      if (v > outA) return 1 - (v - outA) / (outB - outA);
    }
    return 1;
  };

  const shift = (v: number) => {
    if (!isFirst) {
      if (v <= inA) return 14;
      if (v < inB) return 14 * (1 - (v - inA) / (inB - inA));
    }
    if (!isLast) {
      if (v >= outB) return -14;
      if (v > outA) return -14 * ((v - outA) / (outB - outA));
    }
    return 0;
  };

  const opacity = useTransform(progress, presence);
  const y = useTransform(progress, (v) => `${shift(v)}%`);

  return (
    <motion.div className="now__layer" style={{ opacity, y }}>
      <p className="now__word">{label}</p>
      <div className="now__items">
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </motion.div>
  );
}
