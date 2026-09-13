"use client";

import { useSyncExternalStore } from "react";

/**
 * A ticking clock as an external store.
 *
 * The obvious useState + setInterval version trips React 19's
 * set-state-in-effect rule and causes a cascading render on mount. Time is an
 * external system, so it belongs in useSyncExternalStore — and the server
 * snapshot is explicit (null), which keeps SSR and first paint in agreement.
 */
let now: number | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => now;
const getServerSnapshot = (): number | null => null;

/** Milliseconds since epoch, updating each second. null until mounted. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Read a sessionStorage flag once, cached, through the same mechanism — so
 * there is no setState-in-effect and no hydration mismatch.
 */
const flagCache = new Map<string, boolean>();
const noopSubscribe = () => () => {};

export function useSessionFlag(key: string): boolean | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      if (!flagCache.has(key)) {
        let v = false;
        try {
          v = window.sessionStorage.getItem(key) === "1";
        } catch {
          /* blocked storage — treat as unset */
        }
        flagCache.set(key, v);
      }
      return flagCache.get(key) as boolean;
    },
    () => null,
  );
}

export function setSessionFlag(key: string, value: boolean) {
  flagCache.set(key, value);
  try {
    window.sessionStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* non-fatal */
  }
}
