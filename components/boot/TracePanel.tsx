"use client";

import { motion } from "motion/react";

type Props = {
  title: string;
  lines: readonly string[];
  /** Anchor in fixed px, like every other element in the composition. */
  style: React.CSSProperties;
  /** Seconds before the first line appears. */
  delay?: number;
  /** Seconds between lines — the panels stream rather than appear. */
  stagger?: number;
  visible: boolean;
};

/**
 * A telemetry panel from phase 1 of the boot sequence.
 *
 * Lines reveal one at a time on a stagger, which is what the source does — the
 * panels stream in as a log rather than fading in as a block. Reveal is a pure
 * opacity transition per line (transform/opacity only, no layout).
 */
export function TracePanel({ title, lines, style, delay = 0, stagger = 0.055, visible }: Props) {
  return (
    <motion.div
      className="trace"
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: visible ? 0.18 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden="true"
    >
      <p className="trace__title">{title}</p>
      <div className="trace__body">
        {lines.map((l, i) => (
          <motion.span
            key={i}
            className="trace__line"
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{
              duration: 0.1,
              delay: visible ? delay + i * stagger : 0,
            }}
          >
            {l}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
