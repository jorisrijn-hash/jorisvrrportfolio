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

type Action = { type: "READY" } | { type: "GO"; to: "home" | "work" | "about" };

const TRANSITIONS: State[] = ["loading", "to-work", "to-about"];

function reducer(state: State, a: Action): State {
  if (a.type === "READY") return state === "loading" ? "home" : state;

  // Navigation is only accepted from a settled state.
  if (TRANSITIONS.includes(state)) return state;
  if (a.type === "GO") {
    if (a.to === "work" && state !== "work") return "to-work";
    if (a.to === "about" && state !== "about") return "to-about";
    if (a.to === "home") return "home";
  }
  return state;
}

type Ctx = {
  state: State;
  /** True while a transition owns the screen — input must be refused. */
  busy: boolean;
  ready: () => void;
  go: (to: "home" | "work" | "about") => void;
};

const ExperienceContext = createContext<Ctx | null>(null);

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, "loading");

  const value = useMemo<Ctx>(
    () => ({
      state,
      busy: TRANSITIONS.includes(state),
      ready: () => dispatch({ type: "READY" }),
      go: (to) => dispatch({ type: "GO", to }),
    }),
    [state],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): Ctx {
  const c = useContext(ExperienceContext);
  if (!c) throw new Error("useExperience must be used within <ExperienceProvider>");
  return c;
}
