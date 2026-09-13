"use client";

import { motion } from "motion/react";

/**
 * Phase 3: everything retracts and COMPLETE resolves at the centre, inside a
 * contracting ring. This is the beat immediately before the resting
 * composition appears.
 */
export function CompleteBadge({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="complete"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 260 260" fill="none">
        <motion.circle
          cx="130"
          cy="130"
          r="92"
          stroke="var(--color-env-diagram)"
          strokeWidth="1"
          initial={{ scale: 1.35, opacity: 0 }}
          animate={{ scale: visible ? 1 : 1.2, opacity: visible ? 1 : 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "130px 130px" }}
        />
      </svg>
      <span className="complete__label">Complete</span>
    </motion.div>
  );
}
