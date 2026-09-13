"use client";

import { motion } from "motion/react";
import { inView, ruleIn, transition, useReducedMotion } from "@/lib/motion";

/** A hairline that draws itself. Structural punctuation, used instead of boxes. */
export function Rule({ delay = 0, className }: { delay?: number; className?: string }) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={`u-rule ${className ?? ""}`} />;

  return (
    <motion.div
      className={`u-rule ${className ?? ""}`}
      variants={ruleIn}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      transition={{ ...transition.slow, delay }}
    />
  );
}
