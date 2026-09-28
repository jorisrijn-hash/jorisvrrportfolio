"use client";

import { motion } from "motion/react";

/**
 * Phase 1's small signal block at the lower right — a row of bars of varying
 * height. Deterministic heights, so the figure is stable rather than random.
 */
const HEIGHTS = [22, 44, 16, 58, 33, 68, 27, 49, 20, 62, 36, 52, 18, 41];

export function SignalBars({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="sigbars"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.35 }}
      aria-hidden="true"
    >
      {HEIGHTS.map((h, i) => (
        <motion.span
          key={i}
          style={{ height: h }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: visible ? 1 : 0 }}
          transition={{ duration: 0.3, delay: visible ? 0.5 + i * 0.03 : 0, ease: [0.25, 0.8, 0.3, 1] }}
        />
      ))}
    </motion.div>
  );
}
