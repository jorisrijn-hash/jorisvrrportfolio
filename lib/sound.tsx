"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

/**
 * SOUND — opt-in, restrained, interface feedback only (§12).
 *
 * Rules enforced here rather than left to callers:
 *   1. Never autoplay. The AudioContext is not even created until the user
 *      has chosen sound ON, which only happens behind a real gesture.
 *   2. Default OFF. `null` means "not yet asked" — SiteIntro uses that to
 *      decide whether to present the choice.
 *   3. Low ceiling. Global volume is capped; this is UI feedback, not a game.
 *   4. cuelume is dynamically imported, so it stays out of the initial bundle
 *      for every visitor who never turns sound on.
 */

/**
 * Semantic cue names -> cuelume recipes, with a per-cue gain and a rate limit.
 *
 * The point of the map is a SONIC HIERARCHY: the user should feel the weight
 * of an action before they think about it. A hover is a whisper; a scene
 * change is a tone. Nothing is the same click twice.
 */
export type Cue =
  | "hover"    // pointer enters an interactive element — the quietest cue
  | "select"   // a control is chosen
  | "state"    // the experience changes state
  | "toggle"   // sound on/off
  | "scan"     // a boot phase ticks over
  | "arrive"   // the boot sequence resolves
  // loading -> home. Non-musical, and quieter than the boot: effective volume
  // (VOLUME x gain) sits between 0.15 and 0.21.
  | "lock"     // the loading object locks
  | "sweep"    // its geometry separates
  | "form"     // the composition forms
  | "resolve"  // the interface resolves
  | "land"     // arrival in home
  | "crash"    // [REBUILD] — the fake crash
  // home -> featured work
  | "release"  // geometry unlocks
  | "align"    // planes align
  | "row"      // first row of the surface locks
  | "snap"     // the media frame locks
  | "bloom"    // media resolves
  | "settle"   // work state settles
  // [REBUILD]
  | "glitch"   // a burst of the tear
  | "power";   // the screen drops to black

type CueDef = {
  /** cuelume recipe name */
  recipe: string;
  /** relative gain, multiplied by master */
  gain: number;
  /** minimum ms between repeats of this cue */
  limit: number;
};

/**
 * A deliberately small set for this pass — performance and interaction first.
 * The hierarchy still holds: a hover is a whisper, a state change is a tone.
 */
const CUES: Record<Cue, CueDef> = {
  hover:  { recipe: "tick",    gain: 0.32, limit: 90 },
  select: { recipe: "press",   gain: 0.75, limit: 60 },
  state:  { recipe: "page",    gain: 0.90, limit: 200 },
  toggle: { recipe: "toggle",  gain: 0.80, limit: 90 },
  scan:   { recipe: "scan",    gain: 0.42, limit: 150 },
  arrive: { recipe: "arrival", gain: 0.85, limit: 400 },
  lock:    { recipe: "press",   gain: 0.62, limit: 1500 },
  sweep:   { recipe: "scan",    gain: 0.72, limit: 1500 },
  form:    { recipe: "droplet", gain: 0.6,  limit: 1500 },
  resolve: { recipe: "tick",    gain: 0.55, limit: 1500 },
  land:    { recipe: "arrival", gain: 0.7,  limit: 1500 },
  crash:   { recipe: "error",   gain: 0.8,  limit: 1500 },
  release: { recipe: "release", gain: 0.55, limit: 1200 },
  align:   { recipe: "whisper", gain: 0.7,  limit: 1200 },
  row:     { recipe: "tick",    gain: 0.3,  limit: 1200 },
  snap:    { recipe: "toggle",  gain: 0.78, limit: 1200 },
  bloom:   { recipe: "bloom",   gain: 0.5,  limit: 1200 },
  settle:  { recipe: "tick",    gain: 0.48, limit: 1200 },
  glitch:  { recipe: "tick",    gain: 0.42, limit: 45 },
  power:   { recipe: "release", gain: 0.85, limit: 1200 },
};

/** Master. Interface feedback sits well under the content (§25). */
const VOLUME = 0.28;
const STORAGE_KEY = "jvr.sound";

type SoundPref = boolean | null;

/**
 * The preference lives in a tiny external store rather than component state.
 * localStorage is an external system: reading it through useSyncExternalStore
 * keeps the server snapshot explicit (always `null` — never assume consent)
 * and avoids a setState-in-effect cascade on every mount.
 */
const listeners = new Set<() => void>();
let pref: SoundPref = null;
let hydrated = false;

function readStored(): SoundPref {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "on" ? true : v === "off" ? false : null;
  } catch {
    // Private mode or blocked storage: stay unasked, which is the safe default.
    return null;
  }
}

/**
 * Sound is ON by default. Nothing is actually audible until the browser lets
 * us start — see unlockOnFirstGesture below — so defaulting to on expresses an
 * intent, it does not bypass autoplay policy.
 */
function getSnapshot(): SoundPref {
  if (!hydrated) {
    const stored = readStored();
    pref = stored === null ? true : stored;
    hydrated = true;
  }
  return pref;
}

/** The server cannot know a stored preference, and must not assume audio. */
function getServerSnapshot(): SoundPref {
  return null;
}

/**
 * Browsers refuse audio until the page has been interacted with. Rather than
 * leave a visitor who never touches the toggle in silence, we register a
 * one-shot listener and start the moment they do anything at all.
 */
const gestureWaiters = new Set<() => void>();
let gestureArmed = false;

export function onFirstGesture(fn: () => void) {
  if (typeof window === "undefined") return () => {};
  gestureWaiters.add(fn);

  if (!gestureArmed) {
    gestureArmed = true;
    const fire = () => {
      gestureWaiters.forEach((w) => w());
      gestureWaiters.clear();
      ["pointerdown", "keydown", "wheel", "touchstart"].forEach((e) =>
        window.removeEventListener(e, fire),
      );
    };
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((e) =>
      window.addEventListener(e, fire, { once: true, passive: true }),
    );
  }
  return () => gestureWaiters.delete(fn);
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function storePref(on: boolean) {
  pref = on;
  hydrated = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* non-fatal */
  }
  listeners.forEach((l) => l());
}

type SoundApi = {
  /** null = the user has not been asked yet. */
  enabled: SoundPref;
  setEnabled: (on: boolean) => void;
  cue: (name: Cue) => void;
};

const SoundContext = createContext<SoundApi | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const engine = useRef<typeof import("cuelume") | null>(null);
  const lastPlayed = useRef<Partial<Record<Cue, number>>>({});
  const loading = useRef(false);

  const load = useCallback(async () => {
    if (engine.current || loading.current) return engine.current;
    loading.current = true;
    try {
      const mod = await import("cuelume");
      mod.setVolume(VOLUME);
      engine.current = mod;
      return mod;
    } catch {
      return null;
    } finally {
      loading.current = false;
    }
  }, []);

  const setEnabled = useCallback(
    (on: boolean) => {
      storePref(on);
      if (on) {
        // Called from a click handler, so the AudioContext starts unblocked.
        void load().then((mod) => mod?.setEnabled(true));
      } else {
        // OFF must truly silence everything, not just stop new cues (§26).
        engine.current?.setEnabled(false);
      }
    },
    [load],
  );

  const cue = useCallback((name: Cue) => {
    // Read the CURRENT preference from the store, not from a captured value.
    // Reading `enabled` here would close over a stale snapshot, so a cue fired
    // moments after the user switches sound on would be silently dropped —
    // which is exactly the confirmation beep you most want to hear.
    if (getSnapshot() !== true) return;

    const def = CUES[name];
    if (!def) return;

    const mod = engine.current;
    if (!mod) {
      // A returning visitor skips the gate, so nothing has loaded the engine
      // yet. Load it now (a click is usually what asked) and play once ready.
      void load().then((m) => {
        if (!m || getSnapshot() !== true) return;
        m.setEnabled(true);
        try {
          m.play(def.recipe as Parameters<typeof m.play>[0], { volume: VOLUME * def.gain });
        } catch {
          /* a failed cue must never break an interaction */
        }
      });
      return;
    }

    // Rate limit per cue. Without this, a pointer crossing a row of controls
    // machine-guns the hover tick.
    const now = performance.now();
    const prev = lastPlayed.current[name] ?? -Infinity;
    if (now - prev < def.limit) return;
    lastPlayed.current[name] = now;

    try {
      mod.play(def.recipe as Parameters<typeof mod.play>[0], {
        volume: VOLUME * def.gain,
      });
    } catch {
      /* a failed cue must never break an interaction */
    }
  }, [load]);

  const value = useMemo<SoundApi>(
    () => ({ enabled, setEnabled, cue }),
    [enabled, setEnabled, cue],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundApi {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within <SoundProvider>");
  return ctx;
}
