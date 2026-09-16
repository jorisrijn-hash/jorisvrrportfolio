/**
 * Development flags. Kept out of production UI entirely — every one of these
 * is compiled against NODE_ENV so none of it can leak into a build.
 *
 * Toggle by editing here, or at runtime in the console:
 *   __jvr.set("FORCE_INTRO", true)
 */
export type DevFlags = {
  /** Replay the full boot sequence on every load. */
  FORCE_INTRO: boolean;
  /** Outline the 24px grid and the centre construction. */
  SHOW_GRID_DEBUG: boolean;
  /** Skip heavy video layers (posters only). */
  REDUCE_MEDIA: boolean;
  /** Force sound off regardless of user choice. */
  MUTE_SOUND: boolean;
  /** Corner readout of the current experience state. */
  SHOW_STATE: boolean;
  /** Jump state changes instantly, no transition timelines. */
  SKIP_TRANSITIONS: boolean;
  /** Keep the native cursor visible alongside the custom one. */
  CUSTOM_CURSOR_DEBUG: boolean;
  /* ---- atmosphere, for tuning the polish pass ---- */
  /** Drop the global grain field. */
  NO_GRAIN: boolean;
  /** Drop the edge vignette. */
  NO_VIGNETTE: boolean;
  /** Drop the drifting ambient light. */
  NO_AMBIENT: boolean;
  /** Drop the depth haze behind surfaces. */
  NO_HAZE: boolean;
  /** Stop the HUD's micro activity. */
  NO_MICRO: boolean;
};

const DEFAULTS: DevFlags = {
  FORCE_INTRO: false,
  SHOW_GRID_DEBUG: false,
  REDUCE_MEDIA: false,
  MUTE_SOUND: false,
  SHOW_STATE: false,
  SKIP_TRANSITIONS: false,
  CUSTOM_CURSOR_DEBUG: false,
  NO_GRAIN: false,
  NO_VIGNETTE: false,
  NO_AMBIENT: false,
  NO_HAZE: false,
  NO_MICRO: false,
};

const isDev = process.env.NODE_ENV !== "production";
const flags: DevFlags = { ...DEFAULTS };

export function dev<K extends keyof DevFlags>(key: K): DevFlags[K] {
  if (!isDev) return DEFAULTS[key];
  return flags[key];
}

if (isDev && typeof window !== "undefined") {
  (window as unknown as { __jvr: unknown }).__jvr = {
    flags,
    set<K extends keyof DevFlags>(k: K, v: DevFlags[K]) {
      flags[k] = v;
      window.dispatchEvent(new CustomEvent("jvr:devflags"));
      return flags;
    },
  };
}
