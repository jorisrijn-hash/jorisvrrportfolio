"use client";

import { useRef } from "react";
import { cubicBezier, motion, useScroll, useTransform } from "motion/react";
import { WEIGHT, type WeightName } from "@/lib/type";
import { EASE, useReducedMotion } from "@/lib/motion";

/** useTransform wants an easing FUNCTION, not a bezier array. */
const easeSignature = cubicBezier(...(EASE.signature as [number, number, number, number]));

type Props = {
  children: string;
  from?: WeightName;
  to?: WeightName;
  className?: string;
  style?: React.CSSProperties;
  /** Scroll window the transition happens across. */
  offset?: [string, string];
};

/**
 * WEIGHT (Kexsio).
 *
 * 1955 ships four STATIC faces (100/300/500/900) with no variable axis, so
 * font-weight cannot be interpolated. Two real faces are stacked in the same
 * grid cell and crossfaded on scroll progress — the slight difference in glyph
 * widths between weights is what sells it as the word gaining mass.
 *
 * Both layers are aria-hidden with the string exposed once on the wrapper, so
 * the word is announced a single time.
 */
export function WeightText({
  children,
  from = "thin",
  to = "black",
  className,
  style,
  offset = ["start 0.95", "start 0.35"],
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as never,
  });

  const eased = useTransform(scrollYProgress, [0, 1], [0, 1], { ease: easeSignature });

  // Narrow handover band. The two faces have very different glyph widths, so
  // a long crossfade reads as a ghosted double-exposure at display size —
  // most of the scroll should show one clean weight, with a brief morph.
  const out = useTransform(eased, [0, 0.42, 0.58], [1, 1, 0]);
  const inn = useTransform(eased, [0, 0.42, 0.58], [0, 0, 1]);

  // Reduced motion rests on the RESOLVED weight — the composition has to read
  // with no animation at all.
  if (reduced) {
    return (
      <span ref={ref} className={className} style={{ ...style, fontWeight: WEIGHT[to] }}>
        {children}
      </span>
    );
  }

  const layer: React.CSSProperties = { gridArea: "1 / 1", display: "block" };

  return (
    <span
      ref={ref}
      className={className}
      style={{ ...style, display: "grid", alignItems: "start" }}
      aria-label={children}
    >
      <motion.span aria-hidden="true" style={{ ...layer, fontWeight: WEIGHT[from], opacity: out }}>
        {children}
      </motion.span>
      <motion.span aria-hidden="true" style={{ ...layer, fontWeight: WEIGHT[to], opacity: inn }}>
        {children}
      </motion.span>
    </span>
  );
}
