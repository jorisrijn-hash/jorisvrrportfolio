"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { inView, maskUp, transition, useReducedMotion } from "@/lib/motion";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Inherit a parent <motion> sequence instead of triggering on its own. */
  inSequence?: boolean;
};

/**
 * The default reveal (§9 MASK). Content rises through a clipping mask — it
 * does not fade. Under reduced motion it renders at rest, unwrapped.
 *
 * Two structural rules here are load-bearing, not style:
 *
 * 1. The trigger lives on the OUTER (unclipped) element and propagates inward
 *    through variants. Putting whileInView on the clipped child deadlocks it:
 *    the child starts translated outside its own overflow:hidden parent, so
 *    IntersectionObserver measures zero visible area and the reveal never
 *    fires — it stays hidden because it is hidden.
 *
 * 2. Both elements are spans set to display:block. transform and clip-path do
 *    not apply to inline boxes, and a configurable `as` invited invalid
 *    nesting (<p> inside the clipping <span>). Callers bring their own
 *    semantic element around this.
 */
export function MaskReveal({ children, delay = 0, className, inSequence = false }: Props) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <span className={className} style={{ display: "block" }}>
        {children}
      </span>
    );
  }

  const inner = (
    <motion.span
      className={className}
      style={{ display: "block", willChange: "transform" }}
      variants={maskUp}
      transition={{ ...transition.mask, delay }}
    >
      {children}
    </motion.span>
  );

  // Inside a parent sequence the grandparent owns the trigger.
  if (inSequence) {
    return <span className="u-clip">{inner}</span>;
  }

  return (
    <motion.span
      className="u-clip"
      initial="hidden"
      whileInView="visible"
      viewport={inView}
    >
      {inner}
    </motion.span>
  );
}
