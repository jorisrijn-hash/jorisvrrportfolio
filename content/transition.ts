/**
 * LOADING -> HOME — the one timeline.
 *
 * Seconds from the moment the boot sequence hands over. Every moving part of
 * the transition reads its progress from these numbers, so the choreography,
 * the CSS layers and the sound can never drift apart.
 *
 *   0.00 – 0.45  RESOLVE    the loading object (the centre construction) settles in
 *   0.55 – 0.80  LOCK       it contracts and locks
 *   0.80 – 1.25  TRANSFORM  the diamond rotates into an octahedron, rings tilt into 3D
 *   1.10 – 2.20  EXPAND     faces split into tetrahedra, dashes become the cube ring
 *   1.55 – 2.25  BACKGROUND bloom and vignette arrive
 *   2.00 – 2.60  UI         the interface resolves
 */
export const XFER = {
  resolve: [0, 0.45],
  lock: [0.55, 0.8],
  transform: [0.8, 1.25],
  expand: [1.1, 2.0],
  split: 1.25,
  splitDur: 0.72,
  retract: 1.1,
  bloom: 1.55,
  ui: 2.0,
  end: 2.6,
} as const;

/** Sound events, in timeline order. Each fires once. */
export const XFER_CUES = [
  { at: 0.55, cue: "lock" },     // lock click
  { at: 1.15, cue: "sweep" },    // mechanical sweep as the geometry separates
  { at: 1.6, cue: "form" },      // tonal cue as the composition forms
  { at: 2.0, cue: "resolve" },   // tiny tick as the UI resolves
  { at: 2.3, cue: "land" },      // soft arrival
] as const;

/** Length of the seamless home idle loop, in seconds. */
export const IDLE_LOOP = 12;
