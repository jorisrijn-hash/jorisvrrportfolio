/**
 * FEATURED WORK — projects, and the home -> work timeline measured from
 * maintofeaturedwork.mp4.
 *
 * The media surface is built from the home sculpture's cubes: the 68 ring
 * cubes and 48 orbit cubes each fly to one cell of the grid below and hand
 * over to that cell at its lock time. HomeStage (the cubes) and WorkStage (the
 * cells) both read these numbers, so the two can never drift apart.
 */

import { hasCaseStudy, PROJECTS as SOURCE, type Media, type Project } from "@/content/projects";

/**
 * The Work environment's view of a project. The data lives in
 * content/projects.ts; this is only what the surface and its index need, with
 * anything unknown left undefined so the interface omits the row rather than
 * inventing a value.
 */
export type WorkItem = {
  id: string;
  title: string;
  /** what the work was — the roles when known, otherwise its type */
  discipline: string;
  year?: string;
  /** a true system label: "Coming soon", or that the media is a stand-in */
  status?: string;
  media?: Media;
  comingSoon?: boolean;
  slug: string;
  /** there is a case study to open — never true just because a route exists */
  caseStudy: boolean;
};

const item = (p: Project): WorkItem => ({
  id: p.number,
  title: p.title,
  discipline: p.role?.length ? p.role.join(" / ") : p.type,
  year: p.year,
  status: p.status ?? (p.showcaseMedia?.isPlaceholder ? "Placeholder media" : undefined),
  media: p.showcaseMedia,
  comingSoon: p.comingSoon,
  slug: p.slug,
  caseStudy: hasCaseStudy(p),
});

export const PROJECTS: WorkItem[] = SOURCE.map(item);

/**
 * What the site actually serves. A Media `src` names the SOURCE file in
 * media/work/; scripts/encode-media.py writes WebP variants of each to
 * public/work/, and these map a source to the right one:
 *   1680 wide  Retina desktops and laptops
 *    960 wide  1x desktops, phones and small tablets
 * One chooser for everything, so the surface's cells (a CSS background) and
 * the <img> always ask for the same URL and nothing downloads twice.
 */
export type MediaWidth = 960 | 1680;
const variant = (src: string, suffix: string) => src.replace(/\.(jpe?g|png)$/i, `${suffix}.webp`);

/** The width to serve for a surface this many CSS px wide on this screen.
 *  Density is capped at 2x: past that the difference is not visible on a
 *  photograph, and a phone would otherwise pull the desktop file. */
export const mediaWidth = (surfaceCssPx: number): MediaWidth =>
  surfaceCssPx * Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 2) <= 960 ? 960 : 1680;

/** The still a surface is assembled from — the poster, for video. */
export const stillOf = (m: Media | undefined, w: MediaWidth) =>
  m ? (m.kind === "video" ? m.poster : variant(m.src, `-${w}`)) : undefined;

export const mediaStill = (p: WorkItem, w: MediaWidth) => stillOf(p.media, w);

/**
 * The same media, as a responsive source set.
 *
 * The Work surface picks one file itself, because its cells and its <img>
 * must ask for the identical URL. Anything rendered on the server cannot: it
 * has no device pixel ratio to read, and guessing one makes the markup
 * disagree with the browser. So a case study hands both widths to the
 * browser and lets it choose.
 */
export const stillSet = (m: Media | undefined, sizes: string) => {
  if (!m) return null;
  if (m.kind === "video") return m.poster ? { src: m.poster, srcSet: undefined, sizes: undefined } : null;
  return {
    src: variant(m.src, "-960"),
    srcSet: `${variant(m.src, "-960")} 960w, ${variant(m.src, "-1680")} 1680w`,
    sizes,
  };
};

/**
 * The media plane, in reference px around the viewport centre (1920x950).
 * Measured corners: TL (221,123) TR (1002,176) BR (1002,631) BL (221,660) —
 * a 840x537 plane whose right edge is turned 20.1deg away from the camera.
 */
export const PLANE = { x: -739, y: -347, yaw: 20.1, w: 840, h: 537, cols: 18, rows: 12 } as const;

/** Cells that receive a sculpture cube (ring 68 + orbit 48), row-major from the top-left. */
export const FED_CELLS = 116;

/**
 * How many cells a grid of this size is fed by the sculpture — the same
 * proportion as the Work surface (116 of 216). The Featured Work
 * notification forms from a small grid, so only a small arc of the ring
 * leaves the sculpture for it; the rest of Home keeps turning.
 */
export const fedCells = (cols: number, rows: number) =>
  Math.round(FED_CELLS * ((cols * rows) / (PLANE.cols * PLANE.rows)));

/** home -> work */
export const WORK_IN = {
  release: [0.1, 0.95],   // sculpture unlocks: cluster drifts top-right, core sinks
  wire: [0.7, 1.1],       // wireframe grid lays out
  link: 1.0,              // LINK:// VIEWPORT RE-MAP OK
  lockStart: 1.0,         // first cell locks
  rowStep: 0.062,         // rows lock top to bottom...
  colStep: 0.012,         // ...each sweeping left to right (last cell ~1.89)
  glitch: 2.2,            // one brief row slip, as in the reference
  seal: 2.0,              // frame locks: seams close, grid and diagonals fade
  ui: 2.35,               // title, index, metadata
  echo: 2.4,              // echo tiles and viewport label
  solid: 2.5,             // cells hand over to a single media plane
  end: 3.0,
} as const;

/** When a cell locks. The steps scale with the grid, so a coarser phone grid
 *  sweeps over the same time as the desktop one. */
export const lockTime = (row: number, col: number, cols: number = PLANE.cols, rows: number = PLANE.rows) =>
  WORK_IN.lockStart + row * WORK_IN.rowStep * (PLANE.rows / rows) + col * WORK_IN.colStep * (PLANE.cols / cols);

/**
 * work -> home: the formation played backward. The sculpture's formation clock
 * runs from `from` down to 0 at `rate`, and each cell folds away just before
 * its cube reappears.
 */
export const WORK_OUT = { from: 1.62, rate: 1.5, hud: 0.7, end: 1.3 } as const;

/**
 * work <-> about. The surface decomposes into three blocks of cells that
 * re-grid into the About panels' exact rectangles (content/about.ts PANELS)
 * on a plane turned to face the camera, frost over, and hand over to the glass.
 * The same move runs backward coming from About.
 */
export const WORK_ABOUT = {
  /** plane origin once it faces the camera, so it spans the panels' bounds */
  flat: { x: -420, y: -280 },
  // work -> about (AboutStage owns the globe, the panels and arrival)
  dissolve: 1.5,           // cells hand over to the glass panels, tile by tile
  // about -> work (WorkStage owns arrival)
  seal: 1.38,
  ui: 1.5,
  echo: 1.55,
  solid: 1.65,
  end: 2.0,
} as const;

/** Where the released cluster gathers, and how the core sinks (scene units). */
export const WORK_CLUSTER = { x: 290, y: -215, z: 160, spread: 0.72, size: 0.82 } as const;
export const WORK_CORE: [number, number, number] = [-70, 250, 0];
export const WORK_CORE_SCALE = 0.68;

export const WORK_CUES_IN = [
  { at: 0.12, cue: "release" },   // geometry unlocks
  { at: 0.7, cue: "align" },      // planes align
  { at: 1.0, cue: "row" },        // first row locks
  { at: 1.98, cue: "snap" },      // the frame locks — the physical moment
  { at: 2.08, cue: "bloom" },     // media resolves
  { at: 2.9, cue: "settle" },     // work state settles
] as const;

export const WORK_CUES_TO_ABOUT = [
  { at: 0.02, cue: "release" },   // surface unlocks into blocks
  { at: 0.4, cue: "align" },      // blocks re-grid toward the panels
] as const;

export const WORK_CUES_FROM_ABOUT = [
  { at: 0.3, cue: "align" },      // panels break back into cells
  { at: 1.38, cue: "snap" },      // the frame locks
  { at: 1.46, cue: "bloom" },
  { at: 1.95, cue: "settle" },
] as const;

export const WORK_CUES_OUT = [
  { at: 0.02, cue: "release" },
  { at: 0.55, cue: "align" },
  { at: 1.45, cue: "settle" },
] as const;

/**
 * SWITCHING ONE PROJECT FOR ANOTHER, in ms from the moment it is asked for.
 *
 * Not an image swapped behind shutters: one display system reconfiguring
 * itself. The surface releases a little way back in depth, a wave passes
 * through its tiles in the direction of travel, the image underneath changes
 * while the wave is covering it, and the tiles realign from the other side.
 * The identity moves with it — number first, then the name, then the details —
 * so the project reads before its metadata does.
 *
 * Between Home -> Work (3.0s) and nothing at all: deliberate, but never slow.
 *
 *   0        release: the grid lifts off the plane, the outgoing media drifts
 *   media    the source changes, under cover; the number rolls
 *   geometry the wave turns and the tiles begin to close; the name enters
 *   meta     type and role wipe through
 *   end      sealed again: one plane, one layer, exactly where Work expects it
 */
export const WORK_SWAP = { media: 340, geometry: 390, meta: 700, end: 1120 } as const;
