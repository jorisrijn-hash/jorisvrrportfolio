"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { WEIGHT, type WeightName } from "@/lib/type";
import { inView, transition, useReducedMotion } from "@/lib/motion";

type Mode = "cross" | "step";
type Trigger = "inView" | "scroll";

type Props = {
  children: string;
  from?: WeightName;
  to?: WeightName;
  /**
   * cross — two real faces crossfaded; reads as a smooth weight morph.
   * step  — snaps between real faces; crisper, and deliberately editorial.
   */
  mode?: Mode;
  trigger?: Trigger;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * WEIGHT (§9).
 *
 * 1955 ships as four STATIC faces (100/300/500/900) with no variable axis, so
 * `font-weight` cannot be interpolated — the browser would snap, or worse,
 * synthesise a weight that isn't in the family. Both modes below animate
 * between faces that genuinely exist:
 *
 *   cross  stacks the two faces and crossfades them. Glyph widths differ
 *          between weights, and that slight give is what sells it as a morph.
 *   step   renders one face and swaps it outright. No ghosting.
 *
 * If a variable cut of 1955 is ever licensed, add a "vf" mode driving
 * font-variation-settings — the props here would not change.
 */
export function WeightText({
  children,
  from = "thin",
  to = "black",
  mode = "cross",
  trigger = "inView",
  className,
  style,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  // Hooks run unconditionally; only their *use* is conditional below.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.4"],
  });
  const fadeOut = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const fadeIn = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const steppedWeight = useTransform(scrollYProgress, (p) =>
    p > 0.5 ? WEIGHT[to] : WEIGHT[from],
  );

  const byScroll = trigger === "scroll";

  // Reduced motion rests on the RESOLVED weight — the design must read
  // correctly with no animation at all (§2).
  if (reduced) {
    return (
      <span ref={ref} className={className} style={{ ...style, fontWeight: WEIGHT[to] }}>
        {children}
      </span>
    );
  }

  if (mode === "step") {
    return (
      <motion.span
        ref={ref}
        className={className}
        style={{ ...style, fontWeight: byScroll ? steppedWeight : WEIGHT[from] }}
        {...(byScroll
          ? {}
          : {
              whileInView: { fontWeight: WEIGHT[to] },
              viewport: inView,
              // Instant swap after a beat: a step, not a tween.
              transition: { duration: 0, delay: 0.4 },
            })}
      >
        {children}
      </motion.span>
    );
  }

  const layer: React.CSSProperties = { gridArea: "1 / 1", display: "block" };
  const inViewProps = (opacity: number) => ({
    initial: { opacity: opacity === 1 ? 1 : 0 },
    whileInView: { opacity },
    viewport: inView,
    transition: transition.slow,
  });

  return (
    <span
      ref={ref}
      className={className}
      style={{ ...style, display: "grid", alignItems: "start" }}
      aria-label={children}
    >
      <motion.span
        aria-hidden="true"
        style={byScroll
          ? { ...layer, fontWeight: WEIGHT[from], opacity: fadeOut }
          : { ...layer, fontWeight: WEIGHT[from] }}
        {...(byScroll ? {} : inViewProps(0))}
      >
        {children}
      </motion.span>

      <motion.span
        aria-hidden="true"
        style={byScroll
          ? { ...layer, fontWeight: WEIGHT[to], opacity: fadeIn }
          : { ...layer, fontWeight: WEIGHT[to] }}
        {...(byScroll ? {} : inViewProps(1))}
      >
        {children}
      </motion.span>
    </span>
  );
}
