"use client";

import { useEffect, useRef } from "react";
import { addTick } from "@/lib/ticker";

/**
 * FPS METER — development only (SHOW_FPS). Frame rate and the worst frame of
 * the last half second, from the shared frame clock, written straight to its
 * text node. Never rendered in production: Experience only mounts it behind
 * dev("SHOW_FPS"), which is compiled to false in a build.
 */
export function FpsMeter() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frames = 0;
    let worst = 0;
    let since = performance.now();
    return addTick((now, dt) => {
      frames++;
      worst = Math.max(worst, dt);
      if (now - since < 500) return;
      if (el.current) el.current.textContent = `${Math.round((frames * 1000) / (now - since))} fps · worst ${worst.toFixed(1)}ms`;
      frames = 0;
      worst = 0;
      since = now;
    });
  }, []);
  return <div ref={el} className="dev-fps" aria-hidden="true" />;
}
