import { dev } from "@/lib/dev";

/**
 * THE GRID — procedural, two stacked background-images. No raster asset.
 *
 * Measured from loadingempty.png:
 *   cell     24 x 24 px, UNIFORM
 *   vertical lines   x = 0  (mod 24)
 *   horizontal lines y = 14 (mod 24)
 *   ground   #E8E8E8
 *   line     #DEDEDE  (contrast ~10/255)
 *
 * There is deliberately no "large grid". Testing every period from 2x to 10x
 * against the reference gave deltas within +/-0.06 of noise, so the grid is
 * genuinely uniform. What reads as larger cells is the separate block-noise
 * texture (see BlockNoise), not a subdivision.
 */
export function ExperienceGrid() {
  return (
    <div className={`grid-layer ${dev("SHOW_GRID_DEBUG") ? "is-debug" : ""}`} aria-hidden="true" />
  );
}
