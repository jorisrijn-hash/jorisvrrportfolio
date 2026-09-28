"use client";

import { createContext, useContext, useMemo, useReducer } from "react";

/**
 * EXPERIENCE STATE — one controlled value, no scattered booleans.
 *
 * Only one state is active at a time, and navigation is refused while a
 * transition owns the screen. A transition is a STATE here, not a flag, which
 * is what makes that guarantee structural rather than a convention.
 *
 *   gate -> loading -> loading-to-home -> home
 *   home -> to-about -> about -> to-home -> home
 *   home -> home-to-work -> work -> work-to-home -> home
 *   work -> work-to-about -> about -> about-to-work -> work
 *   home -> crash -> gate               ([REBUILD] resets to the sound selection)
 *   home -> to-spotlight -> spotlight   (Featured Work surfaces itself)
 *   spotlight -> spotlight-to-home -> home
 *   spotlight -> spotlight-to-work -> work
 */
export type State =
  | "gate"
  | "loading"
  | "loading-to-home"
  | "home"
  | "crash"
  | "to-about"
  | "about"
  | "to-home"
  | "home-to-work"
  | "work"
  | "work-to-home"
  | "work-to-about"
  | "about-to-work"
  | "to-spotlight"
  | "spotlight"
  | "spotlight-to-home"
  | "spotlight-to-work";

type Action =
  | { type: "BEGIN" }          // the audio choice has been made
  | { type: "SKIP_TO_HOME" }   // already seen this session
  | { type: "READY" }          // the boot sequence finished
  | { type: "ARRIVE" }         // the running transition finished
  | { type: "CRASH" }          // [REBUILD] pressed in home
  | { type: "REBOOT" }         // the fake crash finished
  | { type: "GO"; to: "home" | "work" | "about" }
  | { type: "SPOTLIGHT" }      // Featured Work surfaces, ~2s after Home settles
  | { type: "CLOSE_SPOTLIGHT" }
  | { type: "REPLAY" };

const TRANSITIONS: State[] = [
  "gate", "loading", "loading-to-home", "crash", "to-about", "to-home", "home-to-work", "work-to-home",
  "work-to-about", "about-to-work", "to-spotlight", "spotlight-to-home", "spotlight-to-work",
];

/** `pending`: a destination asked for from the spotlight, resumed once Home
 *  is back (Work needs no such wait — its surface carries straight on). */
type Model = { state: State; runId: number; pending?: "about" };

function reducer(m: Model, a: Action): Model {
  if (a.type === "BEGIN") return m.state === "gate" ? { ...m, state: "loading" } : m;
  if (a.type === "SKIP_TO_HOME") return m.state === "gate" ? { ...m, state: "home" } : m;
  if (a.type === "READY") return m.state === "loading" ? { ...m, state: "loading-to-home" } : m;
  if (a.type === "ARRIVE") {
    if (m.state === "spotlight-to-home") {
      return m.pending === "about"
        ? { ...m, state: "to-about", pending: undefined }
        : { ...m, state: "home" };
    }
    if (m.state === "loading-to-home" || m.state === "to-home" || m.state === "work-to-home") return { ...m, state: "home" };
    if (m.state === "to-spotlight") return { ...m, state: "spotlight" };
    if (m.state === "spotlight-to-work") return { ...m, state: "work" };
    if (m.state === "to-about" || m.state === "work-to-about") return { ...m, state: "about" };
    if (m.state === "home-to-work" || m.state === "about-to-work") return { ...m, state: "work" };
    return m;
  }
  if (a.type === "CRASH") return m.state === "home" ? { ...m, state: "crash" } : m;
  if (a.type === "SPOTLIGHT") return m.state === "home" ? { ...m, state: "to-spotlight" } : m;
  if (a.type === "CLOSE_SPOTLIGHT") {
    // Closing mid-entrance is allowed: the same timeline runs back.
    return m.state === "spotlight" || m.state === "to-spotlight" ? { ...m, state: "spotlight-to-home" } : m;
  }

  // The reboot resets the whole experience to the sound selection. runId bumps
  // so the gate shows again and everything remounts cleanly.
  if (a.type === "REBOOT") return m.state === "crash" ? { state: "gate", runId: m.runId + 1 } : m;

  // Replaying restarts at the gate. Refused mid-transition.
  if (a.type === "REPLAY") {
    return TRANSITIONS.includes(m.state) && m.state !== "gate" && m.state !== "loading"
      ? m
      : { state: "gate", runId: m.runId + 1 };
  }

  const state = m.state;

  // Navigation is only accepted from a settled state.
  if (TRANSITIONS.includes(state)) return m;
  if (a.type === "GO") {
    // From the spotlight, [Work] carries its surface on into the full Work
    // environment; Home and About close it first (HomeHud re-issues the nav).
    if (a.to === "work" && state === "spotlight") return { ...m, state: "spotlight-to-work" };
    if (state === "spotlight") return { ...m, state: "spotlight-to-home", pending: a.to === "about" ? "about" : undefined };
    if (a.to === "about" && state === "home") return { ...m, state: "to-about" };
    if (a.to === "work" && state === "home") return { ...m, state: "home-to-work" };
    if (a.to === "home" && state === "about") return { ...m, state: "to-home" };
    if (a.to === "home" && state === "work") return { ...m, state: "work-to-home" };
    if (a.to === "about" && state === "work") return { ...m, state: "work-to-about" };
    if (a.to === "work" && state === "about") return { ...m, state: "about-to-work" };
  }
  return m;
}

type Ctx = {
  state: State;
  /** True while a transition owns the screen — input must be refused. */
  busy: boolean;
  /** Increments on each replay, so the boot can remount cleanly. */
  runId: number;
  begin: () => void;
  skipToHome: () => void;
  ready: () => void;
  arrive: () => void;
  crash: () => void;
  reboot: () => void;
  go: (to: "home" | "work" | "about") => void;
  spotlight: () => void;
  closeSpotlight: () => void;
  replay: () => void;
};

const ExperienceContext = createContext<Ctx | null>(null);

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [m, dispatch] = useReducer(reducer, { state: "gate", runId: 0 });

  const value = useMemo<Ctx>(
    () => ({
      state: m.state,
      busy: TRANSITIONS.includes(m.state),
      runId: m.runId,
      begin: () => dispatch({ type: "BEGIN" }),
      skipToHome: () => dispatch({ type: "SKIP_TO_HOME" }),
      ready: () => dispatch({ type: "READY" }),
      arrive: () => dispatch({ type: "ARRIVE" }),
      crash: () => dispatch({ type: "CRASH" }),
      reboot: () => dispatch({ type: "REBOOT" }),
      go: (to) => dispatch({ type: "GO", to }),
      spotlight: () => dispatch({ type: "SPOTLIGHT" }),
      closeSpotlight: () => dispatch({ type: "CLOSE_SPOTLIGHT" }),
      replay: () => dispatch({ type: "REPLAY" }),
    }),
    [m.state, m.runId],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): Ctx {
  const c = useContext(ExperienceContext);
  if (!c) throw new Error("useExperience must be used within <ExperienceProvider>");
  return c;
}
