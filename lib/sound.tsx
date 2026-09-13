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

/** Semantic cue names, mapped to cuelume recipes in CUE. */
export type Cue =
  | "hover"
  | "press"
  | "release"
  | "toggle"
  | "navigate"
  | "reveal"
  | "assemble"
  | "enter";

const CUE: Record<Cue, string> = {
  hover: "tick",
  press: "press",
  release: "release",
  toggle: "toggle",
  navigate: "page",
  reveal: "bloom",
  assemble: "scan",
  enter: "arrival",
};

/** Interface feedback sits well under the content. */
const VOLUME = 0.22;
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

function getSnapshot(): SoundPref {
  if (!hydrated) {
    pref = readStored();
    hydrated = true;
  }
  return pref;
}

/** Sound is never on before a gesture, so the server can only say "unasked". */
function getServerSnapshot(): SoundPref {
  return null;
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
        engine.current?.setEnabled(false);
      }
    },
    [load],
  );

  const cue = useCallback(
    (name: Cue) => {
      if (enabled !== true) return;
      const mod = engine.current;
      if (!mod) return;
      try {
        mod.play(CUE[name] as Parameters<typeof mod.play>[0]);
      } catch {
        /* a failed cue must never break an interaction */
      }
    },
    [enabled],
  );

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
