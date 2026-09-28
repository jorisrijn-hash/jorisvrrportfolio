"use client";

import { motion } from "motion/react";
import { LOADING_MODULE } from "@/content/boot";

/**
 * Phase 2's loading module: a label stack inside a dashed circle with a solid
 * arc sweeping its right side, flanked by three small sector brackets.
 *
 * The arc is a stroked circle with a dash offset animation — one CSS-driven
 * transform, no script.
 */
export function LoadingModule({ visible }: { visible: boolean }) {
  const R = 100;

  return (
    <motion.div
      className="loadmod"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.8, 0.3, 1] }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 240 240" fill="none" className="loadmod__svg">
        {/* the reference draws a solid ring with a sweeping arc over it */}
        <circle cx="120" cy="120" r={R} stroke="var(--color-env-diagram)" strokeWidth="1" />
        <circle
          className="loadmod__arc"
          cx="120"
          cy="120"
          r={R}
          stroke="var(--color-env-diagram)"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeDasharray={`${Math.PI * 2 * R * 0.34} ${Math.PI * 2 * R}`}
        />
      </svg>

      <div className="loadmod__text">
        <p className="loadmod__title">{LOADING_MODULE.title}</p>
        {LOADING_MODULE.lines.map((l) => (
          <p key={l} className="loadmod__line">{l}</p>
        ))}
      </div>

      {LOADING_MODULE.sectors.map((s, i) => (
        <span key={s} className="loadmod__sector" data-i={i}>
          <i /><i />
          <em>{s}</em>
        </span>
      ))}
    </motion.div>
  );
}
