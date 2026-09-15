"use client";

import { motion } from "motion/react";
import type { CSSProperties } from "react";

type Props = {
  title: string;
  lines: readonly string[];
  /** Anchor in fixed px, like every other element in the composition. */
  style: CSSProperties;
  /** ms before the first line starts typing. */
  delay?: number;
  /** ms between the start of consecutive lines. */
  stagger?: number;
  /** ms per character. */
  charMs?: number;
  visible: boolean;
};

/**
 * A telemetry panel from phase 1.
 *
 * Lines TYPE in rather than appearing: each is revealed left-to-right by a
 * clip-path animation with a steps() timing function, so the edge lands on
 * character boundaries. clip-path is composited, the step count comes from the
 * line's own length, and nothing runs per frame in JavaScript — the whole
 * panel is a handful of CSS animations.
 */
export function TracePanel({
  title,
  lines,
  style,
  delay = 0,
  stagger = 55,
  charMs = 9,
  visible,
}: Props) {
  return (
    <motion.div
      className="trace"
      style={style}
      data-typing={visible}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: visible ? 0.16 : 0.45, ease: [0.25, 0.8, 0.3, 1] }}
      aria-hidden="true"
    >
      <p className="trace__title">{title}</p>
      <div className="trace__body">
        {lines.map((l, i) => (
          <span
            key={i}
            className="trace__line"
            style={
              {
                "--type-steps": Math.max(8, l.length),
                "--type-dur": `${Math.max(8, l.length) * charMs}ms`,
                "--type-delay": `${delay + i * stagger}ms`,
              } as CSSProperties
            }
          >
            {l}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
