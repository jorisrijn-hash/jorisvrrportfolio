import { WORK_CUES_IN, WORK_IN, WORK_OUT } from "@/content/work";

/**
 * FEATURED WORK — the spotlight is the Work formation, run faster and on a
 * smaller plane (lib/layout SpotlightSpec). Nothing here re-implements that
 * choreography: it scales the one timeline both stages already share.
 */
export const SPOTLIGHT = {
  /** Home has to settle first; then the system surfaces a piece of work. */
  delay: 2000,
  /** shown once per session, whether it was closed or navigated away from */
  sessionKey: "jvr.spotlight",

  /** WORK_IN's 3.0s of choreography, played in ~1.8s. A notification is
   *  quicker than a state, but still assembles rather than appears. */
  rate: 1.7,
  /** and the way back, a little quicker still */
  outRate: 1.3,

  /** seconds on the formation clock (before `rate`) */
  end: WORK_IN.end,
  /** the moment abstract geometry becomes a project display: the VHS pass */
  vhsAt: WORK_IN.seal,
  /** and how hard — a small panel needs a fraction of a full-screen pass */
  vhs: 0.3,

  /**
   * Four small sounds, in the order the panel does its work: a mechanical
   * tick as it begins, the relay of the geometry letting go, the click of
   * the display locking, and one tonal confirmation as the media resolves.
   * Nothing here is an alert — no chime, no ding. (Work's own list has six,
   * and they are louder.)
   */
  cues: [
    { at: 0.1, cue: "row" as const },       // attention: the smallest tick there is
    { at: 0.7, cue: "release" as const },   // the geometry lets go
    { at: 1.98, cue: "snap" as const },     // the display locks
    { at: 2.08, cue: "bloom" as const },    // the media resolves
  ],
  outCues: [{ at: 0.02, cue: "release" as const }],

  /** closing runs WORK_OUT from here, as Work -> Home does */
  outFrom: WORK_OUT.from,
} as const;
