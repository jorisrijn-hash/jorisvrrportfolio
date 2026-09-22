/**
 * FEATURED WORK — projects, and the home -> work timeline measured from
 * maintofeaturedwork.mp4.
 *
 * The media surface is built from the home sculpture's cubes: the 68 ring
 * cubes and 48 orbit cubes each fly to one cell of the grid below and hand
 * over to that cell at its lock time. HomeStage (the cubes) and WorkStage (the
 * cells) both read these numbers, so the two can never drift apart.
 */

import { PROJECTS as SOURCE, type Media, type Project } from "@/content/projects";

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
  thumb?: Media;
  comingSoon?: boolean;
  slug: string;
};

const item = (p: Project): WorkItem => ({
  id: p.number,
  title: p.title,
  discipline: p.role?.length ? p.role.join(" / ") : p.type,
  year: p.year,
  status: p.status ?? (p.showcaseMedia?.isPlaceholder ? "Placeholder media" : undefined),
  media: p.showcaseMedia,
  thumb: p.thumbMedia,
  comingSoon: p.comingSoon,
  slug: p.slug,
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
export const mediaStill = (p: WorkItem, w: MediaWidth) =>
  p.media ? (p.media.kind === "video" ? p.media.poster : variant(p.media.src, `-${w}`)) : undefined;

export const thumbSrc = (p: WorkItem) => (p.thumb ? variant(p.thumb.src, "") : undefined);

/**
 * The media plane, in reference px around the viewport centre (1920x950).
 * Measured corners: TL (221,123) TR (1002,176) BR (1002,631) BL (221,660) —
 * a 840x537 plane whose right edge is turned 20.1deg away from the camera.
 */
export const PLANE = { x: -739, y: -347, yaw: 20.1, w: 840, h: 537, cols: 18, rows: 12 } as const;

/** Cells that receive a sculpture cube (ring 68 + orbit 48), row-major from the top-left. */
export const FED_CELLS = 116;

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

export const lockTime = (row: number, col: number) =>
  WORK_IN.lockStart + row * WORK_IN.rowStep + col * WORK_IN.colStep;

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
