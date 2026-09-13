"use client";

import { motion } from "motion/react";

/**
 * Phase 2's hexagon: a solid inner form inside a larger dashed one.
 *
 * Measured from the source at 1920x950 — inner spans roughly 570..840 x
 * 215..510, outer dashed 520..895 x 155..570, both centred near (705, 362).
 * Drawn as two polygons in one SVG so they share a transform origin and can
 * expand together.
 */
function hex(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(cx + r * Math.sin(a + Math.PI / 2)).toFixed(1)},${(cy - r * Math.cos(a + Math.PI / 2)).toFixed(1)}`;
  }).join(" ");
}

export function HexagonPair({ visible }: { visible: boolean }) {
  const cx = 310;
  const cy = 310;

  return (
    <svg className="hexpair" viewBox="0 0 620 620" fill="none" aria-hidden="true">
      <motion.polygon
        points={hex(cx, cy, 189)}
        stroke="var(--color-env-diagram)"
        strokeWidth="1"
        initial={{ scale: 0.72, opacity: 0 }}
        animate={{ scale: visible ? 1 : 0.82, opacity: visible ? 1 : 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "310px 310px" }}
      />
      <motion.polygon
        points={hex(cx, cy, 274)}
        stroke="var(--color-env-mark)"
        strokeWidth="1"
        strokeDasharray="9 7"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: visible ? 1 : 0.7, opacity: visible ? 1 : 0 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: visible ? 0.12 : 0 }}
        style={{ transformOrigin: "310px 310px" }}
      />
    </svg>
  );
}
