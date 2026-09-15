/**
 * FEATURED WORK — projects, and the home -> work timeline measured from
 * maintofeaturedwork.mp4.
 *
 * The media surface is built from the home sculpture's cubes: the 68 ring
 * cubes and 48 orbit cubes each fly to one cell of the grid below and hand
 * over to that cell at its lock time. HomeStage (the cubes) and WorkStage (the
 * cells) both read these numbers, so the two can never drift apart.
 */

export type ProjectMedia =
  | { type: "image"; src: string; width: number; height: number; alt: string }
  | { type: "video"; src: string; poster: string; width: number; height: number; alt: string };

export type Project = {
  id: string;
  title: string;
  discipline: string;
  year: string;
  status: string;
  media: ProjectMedia;
  thumb: string;
};

/**
 * PLACEHOLDERS. No project media has been supplied yet: these are generated
 * abstract images (scripts/gen-work-placeholders.py) standing in for real
 * work, and the copy is the layout's own example text. Replace per project.
 */
export const PROJECTS: Project[] = [1, 2, 3, 4].map((n) => {
  const id = String(n).padStart(2, "0");
  return {
    id,
    title: "Project Name",
    discipline: "Design / Development",
    year: "2026",
    status: "Placeholder media",
    media: {
      type: "image",
      src: `/work/placeholder-${id}.jpg`,
      width: 1680,
      height: 1074,
      alt: `Placeholder media for project ${id}`,
    },
    thumb: `/work/placeholder-${id}-thumb.jpg`,
  };
});

/** The still a surface is assembled from — the poster, for video. */
export const mediaStill = (p: Project) => (p.media.type === "video" ? p.media.poster : p.media.src);

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
  dissolve: 1.45,          // cells hand over to the glass panels
  // about -> work (WorkStage owns arrival)
  seal: 1.3,
  ui: 1.45,
  echo: 1.5,
  solid: 1.6,
  end: 1.95,
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
  { at: 1.3, cue: "snap" },       // the frame locks
  { at: 1.38, cue: "bloom" },
  { at: 1.9, cue: "settle" },
] as const;

export const WORK_CUES_OUT = [
  { at: 0.02, cue: "release" },
  { at: 0.55, cue: "align" },
  { at: 1.45, cue: "settle" },
] as const;
