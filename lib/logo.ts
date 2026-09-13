/**
 * THE MARK — "cut pointer"
 *
 * An arrowhead with deliberately uneven wings and NO tail. The tail is the
 * part that makes an OS pointer look like an OS pointer, so it is gone; the
 * asymmetry is what keeps the silhouette from reading as a generic play/arrow
 * glyph. A single straight cut, perpendicular to the pointing axis, detaches
 * the tip from the body.
 *
 * The mark is TRUE VECTOR GEOMETRY, not a pixel grid. (V1 defined the logo as
 * grid cells, which meant it could only ever look blocky.) Pixelation is now
 * an *effect* derived from this geometry — see rasterize() — rather than the
 * geometry itself.
 *
 * One shape, three states, driven by `split`:
 *   split 0    solid arrowhead        — favicon, 16px, the custom cursor
 *   split ~.6  tip detached           — header, resting identity
 *   split 1    fully separated planes  — transitions, hover, deconstruction
 *
 * ASSEMBLE is therefore intrinsic: animating split 1 → 0 is the mark locking
 * itself together, not an animation laid over a finished logo.
 */

export const VIEWBOX = 100;

/** Solid outline: tip, long right wing, inner notch, lower wing. */
export const SOLID: ReadonlyArray<readonly [number, number]> = [
  [5, 5],
  [97, 44],
  [48, 54],
  [60, 97],
] as const;

/** The detached tip. Also the shape the custom cursor uses. */
export const TIP: ReadonlyArray<readonly [number, number]> = [
  [5, 5],
  [38.7, 19.3],
  [23, 35],
] as const;

/** The body, with the tip sliced away. */
export const BODY: ReadonlyArray<readonly [number, number]> = [
  [45, 22],
  [97, 44],
  [48, 54],
  [60, 97],
  [26.3, 40.7],
] as const;

export const toPoints = (poly: ReadonlyArray<readonly [number, number]>) =>
  poly.map(([x, y]) => `${x},${y}`).join(" ");

/**
 * Travel applied to each half at split=1, along the pointing axis (45°).
 * The tip advances, the body falls back — the cut opens along its own normal.
 */
export const SPLIT_TRAVEL = 7;

/**
 * Rasterize the solid mark onto an n x n grid — the source for the intro's
 * pixel assembly. Even-odd point-in-polygon against real geometry, so the
 * blocks describe the actual silhouette at every resolution.
 */
export function rasterize(n: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  const step = VIEWBOX / n;

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (contains((x + 0.5) * step, (y + 0.5) * step)) cells.push([x, y]);
    }
  }
  return cells;
}

function contains(px: number, py: number): boolean {
  let inside = false;
  for (let i = 0, j = SOLID.length - 1; i < SOLID.length; j = i++) {
    const [xi, yi] = SOLID[i];
    const [xj, yj] = SOLID[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Deterministic build order for the pixel assembly: blocks resolve outward
 * from the tip, so the mark grows a direction instead of fading up as noise.
 */
export function buildOrder(cells: Array<[number, number]>): number[] {
  return cells
    .map((_, i) => i)
    .sort((a, b) => {
      const da = cells[a][0] + cells[a][1];
      const db = cells[b][0] + cells[b][1];
      return da - db || cells[a][1] - cells[b][1];
    });
}
