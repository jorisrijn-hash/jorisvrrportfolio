"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { GRID, MARK_CELLS, assembleOrder, type AssembleOrder } from "@/lib/logo";
import { DUR, EASE, STAGGER } from "@/lib/motion";

type Props = {
  size?: number;
  gap?: number;
  order?: AssembleOrder;
  /** Per-cell stagger. Total build ≈ CELL_COUNT * stagger. */
  stagger?: number;
  delay?: number;
  onComplete?: () => void;
  className?: string;
};

/**
 * ASSEMBLE (§9). The mark constructs itself from its own cells — the geometry
 * is a cell list (lib/logo), so this is the real shape building, not an
 * animation laid over a finished logo.
 *
 * Each cell drops in from a deterministic offset, so the sequence is identical
 * on every load and can be art-directed rather than being noise.
 */
export function AssemblingMark({
  size = 120,
  gap = 0.14,
  order = "apex",
  stagger = STAGGER.tight,
  delay = 0,
  onComplete,
  className,
}: Props) {
  const delays = useMemo(() => {
    const seq = assembleOrder(order);
    const map = new Array<number>(MARK_CELLS.length);
    seq.forEach((cellIndex, position) => {
      map[cellIndex] = delay + position * stagger;
    });
    return map;
  }, [order, stagger, delay]);

  const lastIndex = useMemo(() => {
    let max = 0;
    for (let i = 1; i < delays.length; i++) if (delays[i] > delays[max]) max = i;
    return max;
  }, [delays]);

  const inset = gap / 2;
  const side = 1 - gap;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${GRID} ${GRID}`}
      fill="none"
      className={className}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {MARK_CELLS.map(([x, y], i) => {
        // The two masses arrive along the fault: the upper half drifts in from
        // up-left, the lower half from down-right, so the build reads as the
        // mark locking into alignment rather than as generic confetti.
        const upper = y <= 3;
        const spread = 0.35 + (i % 3) * 0.25;
        const dx = (upper ? -1 : 1) * 2.2 * spread;
        const dy = (upper ? -1 : 1) * 1.6 * spread;

        return (
          <motion.rect
            key={`${x}-${y}`}
            x={x + inset}
            y={y + inset}
            width={side}
            height={side}
            fill="currentColor"
            initial={{ opacity: 0, scale: 0.3, x: dx, y: dy }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            transition={{
              duration: DUR.base,
              ease: EASE.signature,
              delay: delays[i],
            }}
            style={{ transformOrigin: `${x + 0.5}px ${y + 0.5}px` }}
            onAnimationComplete={i === lastIndex ? onComplete : undefined}
          />
        );
      })}
    </svg>
  );
}
