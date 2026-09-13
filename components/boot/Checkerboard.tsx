"use client";

import { motion } from "motion/react";

/**
 * Phase 2's checkerboard block at the far right: a 3x4 field of cells, some
 * filled, cycling. Deterministic — the fill pattern is a fixed bitmask per
 * step, so the sequence repeats identically rather than flickering randomly.
 */
const STEPS = [0b010110010101, 0b101001101010, 0b011010010110, 0b100101101001];
const COLS = 3;
const ROWS = 4;

export function Checkerboard({ visible, step }: { visible: boolean; step: number }) {
  const mask = STEPS[step % STEPS.length];

  return (
    <motion.div
      className="checker"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      aria-hidden="true"
    >
      {Array.from({ length: COLS * ROWS }, (_, i) => (
        <span key={i} data-on={Boolean(mask & (1 << i))} />
      ))}
    </motion.div>
  );
}
