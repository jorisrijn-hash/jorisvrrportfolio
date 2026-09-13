/**
 * THE MARK
 *
 * An abstracted pointer defined as cells on a 7x7 grid — geometry as DATA,
 * not as a drawn path. Everything the brief asks the mark to do falls out of
 * that decision:
 *
 *   ASSEMBLE     cells genuinely fly in, because the mark *is* cells
 *   PIXELATE     lowering resolution resamples real geometry, not a filter
 *   FAVICON      gap:0 collapses it to one solid silhouette, legible at 16px
 *   CURSOR       the same cells collapse toward the pointer form
 *   MONOCHROME   it is a pure silhouette, so ink/ivory/burgundy all work
 *
 * Shape: two interlocking apexes separated by a diagonal fault. The upper mass
 * converges up-left, the lower mass falls away down-right, and the seam between
 * them is offset rather than continuous.
 *
 * Why this and not an arrow: a single triangle with a void reads as the letter
 * A, and a triangle with a tail is just the OS pointer. The fault keeps the
 * cursor DNA — convergence, direction, selection — while staying a symbol. It
 * also gives the identity its core motion: the two halves slide into alignment
 * to resolve the mark, and apart to deconstruct it.
 *
 *        # #
 *        # # #
 *        # # # #
 *        # # # # #
 *            # # # # #
 *              # # # #
 *                # # #
 */

export const GRID = 7;

/** Cells as [col, row], origin top-left. */
export const MARK_CELLS: ReadonlyArray<readonly [number, number]> = [
  // Upper mass — converges up-left
  [0, 0], [1, 0],
  [0, 1], [1, 1], [2, 1],
  [0, 2], [1, 2], [2, 2], [3, 2],
  [0, 3], [1, 3], [2, 3], [3, 3], [4, 3],
  // Lower mass — offset right across the fault, falling away down-right
  [2, 4], [3, 4], [4, 4], [5, 4], [6, 4],
  [3, 5], [4, 5], [5, 5], [6, 5],
  [4, 6], [5, 6], [6, 6],
] as const;

export const CELL_COUNT = MARK_CELLS.length;

export type AssembleOrder = "apex" | "scan" | "scatter";

/**
 * Stable draw order for staggered ASSEMBLE. Deterministic — no Math.random,
 * so server and client render identically and the sequence is art-directable.
 *
 *   apex     builds outward from the point: the mark "grows" a direction
 *   scan     row by row, like a raster resolving — pairs with the `scan` cue
 *   scatter  fixed pseudo-shuffle for a constructing-from-noise read
 */
export function assembleOrder(mode: AssembleOrder = "apex"): number[] {
  const idx = MARK_CELLS.map((_, i) => i);

  if (mode === "scan") {
    return idx.sort((a, b) => {
      const [ax, ay] = MARK_CELLS[a];
      const [bx, by] = MARK_CELLS[b];
      return ay - by || ax - bx;
    });
  }

  if (mode === "scatter") {
    // Deterministic hash shuffle — same result every render.
    return idx.sort((a, b) => ((a * 2654435761) % 97) - ((b * 2654435761) % 97));
  }

  // apex: Chebyshev distance from the tip at [0,0]
  return idx.sort((a, b) => {
    const [ax, ay] = MARK_CELLS[a];
    const [bx, by] = MARK_CELLS[b];
    return Math.max(ax, ay) - Math.max(bx, by) || ay - by;
  });
}

/**
 * Resample the mark onto a coarser grid. `n` < GRID yields genuinely chunkier
 * geometry (a cell turns on when enough of its source area is filled), which
 * is what makes the intro's pixel-resolve read as real rather than blurred.
 */
export function cellsAtResolution(n: number): Array<[number, number]> {
  if (n >= GRID) return MARK_CELLS.map(([x, y]) => [x, y]);

  const filled = new Set(MARK_CELLS.map(([x, y]) => `${x},${y}`));
  const scale = GRID / n;
  const out: Array<[number, number]> = [];

  for (let ry = 0; ry < n; ry++) {
    for (let rx = 0; rx < n; rx++) {
      let hit = 0;
      let total = 0;
      for (let y = Math.floor(ry * scale); y < Math.min(GRID, Math.ceil((ry + 1) * scale)); y++) {
        for (let x = Math.floor(rx * scale); x < Math.min(GRID, Math.ceil((rx + 1) * scale)); x++) {
          total++;
          if (filled.has(`${x},${y}`)) hit++;
        }
      }
      if (total > 0 && hit / total >= 0.5) out.push([rx, ry]);
    }
  }
  return out;
}
