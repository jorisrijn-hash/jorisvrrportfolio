"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { SOLID, VIEWBOX, buildOrder, rasterize, toPoints } from "@/lib/logo";
import { DUR, EASE } from "@/lib/motion";

type Props = {
  size?: number;
  /** Grid resolution of the pixel phase. */
  res?: number;
  stagger?: number;
  delay?: number;
  /** Fires when the last block has landed — cue the resolve to vector. */
  onAssembled?: () => void;
  /** Crossfades the blocks out and the sharp vector mark in. */
  resolved?: boolean;
};

/**
 * PIXEL-ASSEMBLE (Nightkidz).
 *
 * Blocks are a rasterization of the REAL mark geometry, so what assembles is
 * genuinely the logo at low resolution — then it resolves to the sharp vector.
 * Deliberately not an opacity fade: each block scales and snaps into place on
 * a stagger that runs outward from the tip.
 */
export function PixelMark({
  size = 160,
  res = 14,
  stagger = 0.016,
  delay = 0,
  onAssembled,
  resolved = false,
}: Props) {
  const cells = useMemo(() => rasterize(res), [res]);
  const order = useMemo(() => buildOrder(cells), [cells]);

  const delays = useMemo(() => {
    const map = new Array<number>(cells.length);
    order.forEach((cellIndex, position) => {
      map[cellIndex] = delay + position * stagger;
    });
    return map;
  }, [cells.length, order, stagger, delay]);

  const last = useMemo(() => order[order.length - 1] ?? 0, [order]);
  const unit = VIEWBOX / res;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill="none"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <motion.g
        animate={{ opacity: resolved ? 0 : 1 }}
        transition={{ duration: DUR.snap, ease: EASE.signature }}
      >
        {cells.map(([x, y], i) => (
          <motion.rect
            key={`${x}-${y}`}
            x={x * unit}
            y={y * unit}
            width={unit * 0.86}
            height={unit * 0.86}
            fill="currentColor"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DUR.snap, ease: EASE.signature, delay: delays[i] }}
            style={{ transformOrigin: `${x * unit + unit / 2}px ${y * unit + unit / 2}px` }}
            onAnimationComplete={i === last ? onAssembled : undefined}
          />
        ))}
      </motion.g>

      {/* The sharp mark the blocks resolve into. */}
      <motion.polygon
        points={toPoints(SOLID)}
        fill="currentColor"
        initial={{ opacity: 0 }}
        animate={{ opacity: resolved ? 1 : 0 }}
        transition={{ duration: DUR.base, ease: EASE.signature }}
      />
    </svg>
  );
}
