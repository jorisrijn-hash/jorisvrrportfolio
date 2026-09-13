"use client";

import { createContext, useCallback, useContext, useMemo, useReducer } from "react";

/**
 * EXPERIENCE STATE — one controlled value, no scattered booleans.
 *
 * Only one state is active at a time, and navigation is refused while a
 * transition owns the screen. A transition is a STATE here, not a flag, which
 * is what makes that guarantee structural rather than a convention.
 */
export type State = "loading" | "home" | "to-work" | "work" | "to-about" | "about";

type Action =
  | { type: "READY" }
  | { type: "GO"; to: "home" | "work" | "about" }
  | { type: "REPLAY" };

const TRANSITIONS: State[] = ["loading", "to-work", "to-about"];

type Model = { state: State; runId: number };

function reducer(m: Model, a: Action): Model {
  if (a.type === "READY") return m.state === "loading" ? { ...m, state: "home" } : m;

  // Replaying restarts the boot. runId bumps so the sequence remounts cleanly
  // rather than trying to resume half-finished timers.
  if (a.type === "REPLAY") return { state: "loading", runId: m.runId + 1 };

  const state = m.state;

  // Navigation is only accepted from a settled state.
  if (TRANSITIONS.includes(state)) return m;
  if (a.type === "GO") {
    if (a.to === "work" && state !== "work") return { ...m, state: "to-work" };
    if (a.to === "about" && state !== "about") return { ...m, state: "to-about" };
    if (a.to === "home") return { ...m, state: "home" };
  }
  return m;
}

type Ctx = {
  state: State;
  /** True while a transition owns the screen — input must be refused. */
  busy: boolean;
  /** Increments on each replay, so the boot can remount cleanly. */
  runId: number;
  ready: () => void;
  go: (to: "home" | "work" | "about") => void;
  replay: () => void;
};

const ExperienceContext = createContext<Ctx | null>(null);

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [m, dispatch] = useReducer(reducer, { state: "loading", runId: 0 });

  const value = useMemo<Ctx>(
    () => ({
      state: m.state,
      busy: TRANSITIONS.includes(m.state),
      runId: m.runId,
      ready: () => dispatch({ type: "READY" }),
      go: (to) => dispatch({ type: "GO", to }),
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
