"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AUTH_BLOCK } from "@/content/boot";

/**
 * Phase 2's authentication readout. The viewport row reports the REAL viewport
 * — in the source it reads the actual window, which is the point of a readout.
 */
export function AuthBlock({ visible }: { visible: boolean }) {
  const [viewport, setViewport] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);

  useEffect(() => {
    const read = () =>
      setViewport(`${window.innerWidth}x${window.innerHeight}px · DPR ${window.devicePixelRatio}`);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  // The readout accrues as the phase runs, rather than appearing complete.
  // No synchronous reset here: `shown` below derives the displayed stage from
  // `visible`, so there is no setState in the effect body.
  useEffect(() => {
    if (!visible) return;
    const timers = AUTH_BLOCK.stages.map(([ms], i) =>
      window.setTimeout(() => setStage(i), ms as number),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [visible]);

  const shown = visible ? stage : -1;

  return (
    <motion.div
      className="authblock"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden="true"
    >
      <p className="authblock__title">{AUTH_BLOCK.title}</p>
      <dl className="authblock__rows">
        {AUTH_BLOCK.rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}:</dt>
            <dd suppressHydrationWarning>{v ?? viewport ?? "—"}</dd>
          </div>
        ))}
      </dl>

      <div className="authblock__stages">
        {AUTH_BLOCK.stages.map(([, line], i) => (
          <motion.p
            key={i}
            animate={{ opacity: i <= shown ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            data-strong={i === 2 ? "true" : undefined}
          >
            {line}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}
