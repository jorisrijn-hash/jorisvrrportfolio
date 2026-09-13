"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Transition, Variants } from "motion/react";

/**
 * THE MOTION SYSTEM
 *
 * One source for every timing on the site. No component declares a raw
 * duration or easing — §27. Values mirror the CSS custom properties in
 * tokens.css so CSS transitions and Motion animations stay in lockstep.
 */

/** Seconds, to match Motion's unit. CSS equivalents live in tokens.css. */
export const DUR = {
  snap: 0.18,
  base: 0.42,
  slow: 0.76,
  drape: 1.1,
} as const;

/** The signature curve: decisive deceleration, no overshoot. */
export const EASE = {
  signature: [0.16, 1, 0.3, 1],
  mask: [0.65, 0, 0.35, 1],
  exit: [0.4, 0, 1, 1],
} as const;

export const STAGGER = {
  tight: 0.04,
  base: 0.07,
  loose: 0.12,
} as const;

export const TRAVEL = {
  sm: 8,
  md: 20,
} as const;

export const transition = {
  snap: { duration: DUR.snap, ease: EASE.signature },
  base: { duration: DUR.base, ease: EASE.signature },
  slow: { duration: DUR.slow, ease: EASE.signature },
  mask: { duration: DUR.slow, ease: EASE.mask },
  drape: { duration: DUR.drape, ease: EASE.signature },
} satisfies Record<string, Transition>;

/**
 * MASK is the default reveal (§9). Text rises through a clip, it does not
 * fade. `opacity` is intentionally absent — the clip does the work.
 */
export const maskUp: Variants = {
  hidden: { y: "110%", clipPath: "inset(0 0 100% 0)" },
  visible: {
    y: "0%",
    clipPath: "inset(0 0 -10% 0)",
    transition: transition.mask,
  },
};

/** Horizontal rule / line reveal. */
export const ruleIn: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: transition.slow },
};

/** Supporting metadata resolves last and quietly (§10, step 3). */
export const metaIn: Variants = {
  hidden: { opacity: 0, y: TRAVEL.sm },
  visible: { opacity: 1, y: 0, transition: transition.base },
};

/** Parent orchestrator — children inherit the staggered sequence. */
export function sequence(stagger: number = STAGGER.base, delay = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };
}

/**
 * Media-query state via useSyncExternalStore rather than useState+useEffect:
 * no cascading render on mount, and the server snapshot is explicit.
 */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // Server and first paint assume no preference, so components render their
    // animated state and only stand down if the user has actually asked.
    () => false,
  );
}

/**
 * Reduced motion. Components should render their RESTING state when this is
 * true, never their hidden state — the design has to stand up unanimated.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True only for precise pointers — gates the custom cursor and hover motion. */
export function useFinePointer(): boolean {
  return useMediaQuery("(pointer: fine) and (hover: hover)");
}

/** Shared viewport config so sections trigger consistently. */
export const inView = { once: true, amount: 0.35 } as const;
