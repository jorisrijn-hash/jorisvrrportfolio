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

  /** WORK_IN's 3.0s of choreography, played in ~1.9s. */
  rate: 1.6,
  /** and the way back, a little quicker still */
  outRate: 1.3,

  /** seconds on the formation clock (before `rate`) */
  end: WORK_IN.end,
  /** the moment abstract geometry becomes a project display: the VHS pass */
  vhsAt: WORK_IN.seal,

  /**
   * Three cues for the whole entrance, not one per stage: the release, the
   * lock, and the media resolving. (Work's own list has six.)
   */
  cues: WORK_CUES_IN.filter((c) => c.cue === "release" || c.cue === "snap" || c.cue === "bloom"),
  outCues: [{ at: 0.02, cue: "release" as const }],

  /** closing runs WORK_OUT from here, as Work -> Home does */
  outFrom: WORK_OUT.from,
} as const;
