"use client";

import { useSyncExternalStore } from "react";

/**
 * Session flags as an external store: read once from sessionStorage, and
 * null on the server so SSR and first paint agree.
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

/** Read a session flag outside React (the spotlight's once-per-session gate). */
export function sessionFlag(key: string): boolean {
  if (flagCache.has(key)) return flagCache.get(key) as boolean;
  let v = false;
  try {
    v = window.sessionStorage.getItem(key) === "1";
  } catch {
    /* blocked storage — treat as unset */
  }
  flagCache.set(key, v);
  return v;
}

export function setSessionFlag(key: string, value: boolean) {
  flagCache.set(key, value);
  try {
    window.sessionStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* non-fatal */
  }
}
