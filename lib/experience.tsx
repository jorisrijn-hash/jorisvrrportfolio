"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { dev } from "./dev";

/**
 * EXPERIENCE STATE MACHINE
 *
 * One reducer owns the whole experience. No scattered booleans: a transition
 * is a state, not a flag, which is what makes it possible to lock input while
 * one is running and to guarantee only one timeline is ever active.
 */
export type State =
  | "BOOT"
  | "HOME"
  | "WORK_IN"
  | "WORK"
  | "WORK_OUT"
  | "ABOUT_IN"
  | "ABOUT"
  | "ABOUT_OUT";

export type Action =
  | { type: "BOOT_DONE" }
  | { type: "GO_WORK" }
  | { type: "GO_ABOUT" }
  | { type: "GO_HOME" }
  | { type: "ARRIVED" }
  | { type: "SET_PROJECT"; index: number };

type Ctx = {
  state: State;
  /** True while a transition timeline owns the screen. */
  busy: boolean;
  projectIndex: number;
  go: (to: "HOME" | "WORK" | "ABOUT") => void;
  setProject: (i: number) => void;
  bootDone: () => void;
};

/** Transition durations, taken from the reference files. */
export const SCENE_MS = {
  WORK_IN: 5200,   // maintofeaturedwork: panel flies in and settles
  WORK_OUT: 1800,  // clears back to home
  ABOUT_IN: 3200,  // maintoabout: globe resolves, panels slide in
  ABOUT_OUT: 2200,
} as const;

const BUSY: State[] = ["BOOT", "WORK_IN", "WORK_OUT", "ABOUT_IN", "ABOUT_OUT"];

type Model = { state: State; projectIndex: number };

function reducer(m: Model, a: Action): Model {
  switch (a.type) {
    case "BOOT_DONE":
      return m.state === "BOOT" ? { ...m, state: "HOME" } : m;

    // Navigation is only accepted from a settled state — this is what stops
    // double navigation and overlapping timelines.
    case "GO_WORK":
      return m.state === "HOME" ? { ...m, state: "WORK_IN" } : m;
    case "GO_ABOUT":
      return m.state === "HOME" ? { ...m, state: "ABOUT_IN" } : m;
    case "GO_HOME":
      if (m.state === "WORK") return { ...m, state: "WORK_OUT" };
      if (m.state === "ABOUT") return { ...m, state: "ABOUT_OUT" };
      return m;

    case "ARRIVED":
      if (m.state === "WORK_IN") return { ...m, state: "WORK" };
      if (m.state === "ABOUT_IN") return { ...m, state: "ABOUT" };
      if (m.state === "WORK_OUT" || m.state === "ABOUT_OUT")
        return { ...m, state: "HOME" };
      return m;

    case "SET_PROJECT":
      return { ...m, projectIndex: a.index };
    default:
      return m;
  }
}

const ExperienceContext = createContext<Ctx | null>(null);

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [model, dispatch] = useReducer(reducer, { state: "BOOT", projectIndex: 0 });
  const timer = useRef<number | null>(null);

  const busy = BUSY.includes(model.state);

  // Each transition state auto-advances after its own duration. One timer,
  // cleared on every state change, so timelines can never overlap.
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    const ms = SCENE_MS[model.state as keyof typeof SCENE_MS];
    if (ms === undefined) return;
    const wait = dev("SKIP_TRANSITIONS") ? 0 : ms;
    timer.current = window.setTimeout(() => dispatch({ type: "ARRIVED" }), wait);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [model.state]);

  const go = useCallback((to: "HOME" | "WORK" | "ABOUT") => {
    dispatch({ type: to === "HOME" ? "GO_HOME" : to === "WORK" ? "GO_WORK" : "GO_ABOUT" });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state: model.state,
      busy,
      projectIndex: model.projectIndex,
      go,
      setProject: (i: number) => dispatch({ type: "SET_PROJECT", index: i }),
      bootDone: () => dispatch({ type: "BOOT_DONE" }),
    }),
    [model.state, model.projectIndex, busy, go],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): Ctx {
  const c = useContext(ExperienceContext);
  if (!c) throw new Error("useExperience must be used within <ExperienceProvider>");
  return c;
}

/** Convenience: which top-level surface should be mounted. */
export function surfaceOf(state: State): "BOOT" | "HOME" | "WORK" | "ABOUT" {
  if (state === "BOOT") return "BOOT";
  if (state.startsWith("WORK")) return "WORK";
  if (state.startsWith("ABOUT")) return "ABOUT";
  return "HOME";
}
