"use client";

/**
 * VHS — a request for one pass of analog interference over a transition.
 *
 * The layer itself (components/atmosphere/Vhs.tsx) owns the timing and the
 * look; this is only the doorbell, so a stage can ask for a pass at an exact
 * moment (About cutting back to its top under the tear) without knowing how
 * it is drawn. Two requests inside one window collapse into the first.
 */
export type VhsPass = {
  /** ms from now */
  delay: number;
  /** 0..1 — Work <-> About runs lighter than Home <-> About */
  strength: number;
};

const subs = new Set<(p: VhsPass) => void>();
let lastAt = -Infinity;
const WINDOW = 700;

export function triggerVhs(p: Partial<VhsPass> = {}) {
  const now = performance.now();
  if (now - lastAt < WINDOW) return;
  lastAt = now;
  const pass = { delay: 0, strength: 1, ...p };
  subs.forEach((fn) => fn(pass));
}

export function onVhs(fn: (p: VhsPass) => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
