"use client";

import { dev } from "@/lib/dev";

/**
 * THE GRID — procedural, per the brief. No raster background.
 *
 * Measured from loadingempty.png:
 *   cell           24 x 24 px
 *   verticals      x = 0  (mod 24)
 *   horizontals    y = 14 (mod 24)
 *   ground         #E8E8E8
 *   line           #DEDEDE  (contrast ~10/255)
 *
 * The grid does NOT sit at uniform strength: measured contrast falls from
 * ~10.7 at the edges to ~6.6 at the centre, so a ground-coloured radial wash
 * is laid over it. That wash is the reason the reference reads as "empty" at
 * a glance and technical on inspection.
 *
 * Two stacked background-images rather than an SVG pattern: the browser
 * composites these on the GPU and they cost nothing to animate or resize.
 */
export function GridSystem({ className }: { className?: string }) {
  const debug = dev("SHOW_GRID_DEBUG");

  return (
    <div className={`env-grid ${debug ? "is-debug" : ""} ${className ?? ""}`} aria-hidden="true">
      <div className="env-grid__lines" />
      <div className="env-grid__wash" />
    </div>
  );
}
