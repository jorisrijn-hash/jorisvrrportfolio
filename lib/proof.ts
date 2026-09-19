"use client";

import { useSyncExternalStore } from "react";
import { TESTIMONIALS } from "@/content/proof";
import { computeLayout, type ProofSpec } from "@/lib/layout";

/**
 * PROOF — the one progress value behind Home -> Social Proof.
 *
 *   0  the Home composition        1  the Social Proof composition
 *
 * ProofSequence owns it: it reads the scroll offset, smooths it, and writes
 * it here once per frame. HomeStage reads it inside its own frame to morph
 * the sculpture; nothing else animates independently, so scrolling back
 * replays the exact same function in reverse.
 *
 * React only hears about two thresholds (with hysteresis), so a scroll never
 * causes a render per tick:
 *   active  the sequence has left Home (the HUD quiets, [REBUILD] steps back)
 *   proof   the proof composition has formed (labels switch)
 */
let value = 0;
let active = false;
let formed = false;
const listeners = new Set<() => void>();

export const getProof = () => value;

export function setProof(v: number) {
  value = v;
  const a = active ? v > 0.01 : v > 0.03;
  const f = formed ? v > 0.72 : v > 0.82;
  if (a !== active || f !== formed) {
    active = a;
    formed = f;
    listeners.forEach((l) => l());
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** 0 = Home, 1 = moving, 2 = proof formed. */
export function useProofPhase(): 0 | 1 | 2 {
  return useSyncExternalStore(subscribe, () => (formed ? 2 : active ? 1 : 0), () => 0);
}

/* ---- the scroller, so navigation can bring Home back first --------------- */
let scroller: HTMLElement | null = null;
export function registerProofScroller(el: HTMLElement | null) {
  scroller = el;
}

/**
 * Scroll back to the Home composition and resolve once the sculpture has
 * reformed — used before leaving Home for Work or About, whose transitions
 * start from the Home pose. Immediate when already there.
 */
export function returnHome(reduced = false): Promise<void> {
  if (!scroller || value < 0.005) return Promise.resolve();
  scroller.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  return new Promise((resolve) => {
    const t0 = performance.now();
    const check = () => {
      if (value < 0.005 || performance.now() - t0 > 1400) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

/* ---- what may be shown ------------------------------------------------------ */
const isDev = process.env.NODE_ENV !== "production";
const noop = () => () => {};

/**
 * Real entries always; placeholders only in development or with
 * ?preview=proof. Empty in production until real testimonials exist, which
 * switches the whole sequence off.
 */
export function useTestimonials() {
  const preview = useSyncExternalStore(
    noop,
    () => new URLSearchParams(window.location.search).get("preview") === "proof",
    () => false,
  );
  const showPlaceholders = isDev || preview;
  return TESTIMONIALS.filter((t) => !t.isPlaceholder || showPlaceholders);
}

/* ---- lane geometry, re-read on resize only --------------------------------- */
let specKey = "";
let spec: ProofSpec | null = null;
const getSpec = () => {
  const k = `${window.innerWidth}x${window.innerHeight}`;
  if (k !== specKey) {
    specKey = k;
    spec = computeLayout().proof;
  }
  return spec;
};
const onResize = (l: () => void) => {
  window.addEventListener("resize", l);
  return () => window.removeEventListener("resize", l);
};
export function useProofSpec(): ProofSpec | null {
  return useSyncExternalStore(onResize, getSpec, () => null);
}
