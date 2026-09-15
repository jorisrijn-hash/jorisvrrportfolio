/**
 * HOME <-> ABOUT — the timelines, measured from maintoabout.mp4.
 *
 * Seconds from the state change. The sculpture (HomeStage) and the globe
 * (AboutStage) both read these, so the collapse, the globe and the panels can
 * never drift apart.
 */

/** home -> about */
export const ABOUT_IN = {
  collapse: [0, 0.75],     // the sculpture folds into the centre
  rings: [0.3, 1.1],       // orbit rings contract in from wider radii
  wire: [0.45, 1.05],      // wireframe globe forms
  wireOut: [1.2, 1.8],
  globe: [0.95, 1.55],     // land fills in
  labels: 0.5,             // ROUTE / HANDSHAKE labels
  online: 1.2,             // PROFILE ONLINE
  labelsOut: 1.85,
  panels: 1.4,             // glass panels settle, staggered
  end: 2.4,
} as const;

/** about -> home */
export const ABOUT_OUT = {
  panels: 0,               // panels lift away
  globe: [0.2, 0.85],      // the globe spins out and shrinks away
  rings: [0.15, 0.8],
  collapse: [0.45, 1.6],   // the sculpture bursts back out of the centre
  ui: 1.1,                 // home interface returns
  end: 1.8,
} as const;

export const ABOUT_CUES_IN = [
  { at: 0, cue: "sweep" },
  { at: 1.0, cue: "form" },
  { at: 1.45, cue: "resolve" },
  { at: 2.15, cue: "land" },
] as const;

export const ABOUT_CUES_OUT = [
  { at: 0.05, cue: "sweep" },
  { at: 0.7, cue: "form" },
  { at: 1.5, cue: "land" },
] as const;

/** Geometry, in reference pixels relative to the viewport centre. */
export const GLOBE = {
  r: 305,
  ringInner: 378,
  ringOuter: 449,
  /** the view the reference holds: East Asia */
  lon: 128,
  lat: 22,
  /** degrees of longitude per second while About is open — the reference
   *  barely turns; at this rate the coastline re-projects ~every 150ms */
  drift: 0.8,
} as const;

/**
 * The glass panels' rectangles [x, y, w, h] around the viewport centre, in
 * reference px. Mirrored in app/experience.css (.about__panel[data-panel]);
 * Work re-grids its cells into exactly these when it becomes About.
 */
export const PANELS = {
  top: [-405, -279, 814, 233],
  meta: [-405, -3, 394, 200],
  body: [15, -3, 394, 283],
} as const;

export const ABOUT_LABELS = {
  route: "Route:// /about requested",
  handshake: "Module:// Profile_core handshake...",
  online: "Module:// Profile online",
} as const;
