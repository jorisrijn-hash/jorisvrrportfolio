"use client";

import { useSyncExternalStore } from "react";

/**
 * STAGES — the heavy parts of the experience, loaded when they are wanted
 * rather than with the first page.
 *
 *   boot    the loading sequence (and Motion, which only it uses)
 *   about   the globe (d3-geo, topojson) and the About page
 *   work    the featured-work surface
 *   case    a case study and its sections
 *
 * Not React.lazy: a lazy component suspends for a render even once its code
 * is in, which would mount a stage a frame after its state change and shift
 * its timeline against the sculpture's. Here navigation awaits `load(name)`
 * — already resolved in practice, since stages are fetched on idle and on
 * hover — and the stage mounts in the same commit as its state.
 */
type Mods = {
  boot: typeof import("@/components/boot/BootSequence");
  about: typeof import("@/components/about/AboutStage");
  work: typeof import("@/components/work/WorkStage");
  case: typeof import("@/components/case/CaseStudy");
};
type Name = keyof Mods;

const importers: { [K in Name]: () => Promise<Mods[K]> } = {
  boot: () => import("@/components/boot/BootSequence"),
  about: () => import("@/components/about/AboutStage"),
  work: () => import("@/components/work/WorkStage"),
  case: () => import("@/components/case/CaseStudy"),
};

const loaded: Partial<Mods> = {};
const pending: Partial<{ [K in Name]: Promise<Mods[K]> }> = {};
const listeners = new Set<() => void>();

export function load<K extends Name>(name: K): Promise<Mods[K]> {
  if (loaded[name]) return Promise.resolve(loaded[name] as Mods[K]);
  if (!pending[name]) {
    pending[name] = importers[name]()
      .then((m) => {
        loaded[name] = m;
        listeners.forEach((l) => l());
        return m;
      })
      .catch((e) => {
        delete pending[name];
        throw e;
      }) as never;
  }
  return pending[name] as Promise<Mods[K]>;
}

/** The loaded module, or null. Re-renders its caller once it arrives. */
export function useStage<K extends Name>(name: K): Mods[K] | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (loaded[name] as Mods[K] | undefined) ?? null,
    () => null,
  );
}

/** Fetch stages once the browser has nothing better to do. */
export function loadWhenIdle(...names: Name[]) {
  if (typeof window === "undefined") return;
  const go = () => names.forEach((n) => void load(n).catch(() => {}));
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(go, { timeout: 2500 });
  else window.setTimeout(go, 1200);
}
