"use client";

import { useEffect, useRef } from "react";
import { dev } from "@/lib/dev";
import { addTick } from "@/lib/ticker";
import { COMPACT_QUERY } from "@/lib/layout";

/** One slow pass of the light, in seconds. */
const CYCLE_A = 22;
const CYCLE_B = 29;
/** How often the light is nudged. */
const STEP_MS = 1100;

/**
 * ATMOSPHERE — the polish layer, as one element plus two custom properties.
 *
 *   .atmos__field   grain and vignette together, over everything: a fine
 *                   two-polarity texture so the ivory reads as stock, over an
 *                   almost invisible edge falloff that settles the centre.
 *   --amb-x/--amb-y the ambient light. The gradients themselves live on the
 *                   EXISTING wash layer (app/experience.css), so the light
 *                   costs no layer of its own; this only nudges them.
 *
 * Layer count is the whole story for performance here. Every full-screen layer
 * is re-blended whenever anything beneath it repaints, and About's globe
 * repaints constantly: as its own layer the ambient light cost ~40 of 195
 * frames there, so it moved into the wash. For the same reason the light is
 * stepped from the SHARED ticker rather than run as a CSS animation — a
 * continuously animating full-screen layer measured a flat 30fps in Work and
 * About. Reduced motion and compact screens keep the light and skip the move.
 *
 * Intensity lives in tokens: --grain-opacity carries the field's opacity,
 * --vignette-strength is expressed relative to it, --ambient-opacity scales
 * the wash's light. [data-busy] lifts them for the length of a transition.
 *
 * Dev flags NO_GRAIN / NO_VIGNETTE / NO_AMBIENT drop a layer while tuning.
 */
export function Atmosphere() {
  const field = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dev("NO_AMBIENT")) return;
    const stage = field.current?.closest<HTMLElement>(".experience");
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia(COMPACT_QUERY).matches) return;

    const start = performance.now();
    let last = -Infinity;

    return addTick((now) => {
      if (now - last < STEP_MS) return;
      last = now;
      const t = (now - start) / 1000;
      const pa = (Math.sin((t / CYCLE_A) * Math.PI * 2) + 1) / 2;
      const pb = (Math.sin((t / CYCLE_B) * Math.PI * 2 + 1.7) + 1) / 2;
      stage.style.setProperty("--amb-x", `${(-40 + pa * 90).toFixed(1)}px`);
      stage.style.setProperty("--amb-y", `${(-30 + pb * 70).toFixed(1)}px`);
    });
  }, []);

  const classes = [
    "atmos__field",
    dev("NO_GRAIN") ? "no-grain" : "",
    dev("NO_VIGNETTE") ? "no-vignette" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="atmos" aria-hidden="true">
      <div ref={field} className={classes} />
    </div>
  );
}
