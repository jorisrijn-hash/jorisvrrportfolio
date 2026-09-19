"use client";

import { useEffect, useRef } from "react";
import type { State } from "@/lib/experience";
import { onVhs, triggerVhs } from "@/lib/vhs";
import { useSound } from "@/lib/sound";
import { dev } from "@/lib/dev";

/** Which transitions get a pass, how far in, and how strong. */
const PASSES: Partial<Record<State, { delay: number; strength: number }>> = {
  "to-about": { delay: 140, strength: 1 },
  "to-home": { delay: 120, strength: 1 },
  "work-to-about": { delay: 200, strength: 0.7 },
  "about-to-work": { delay: 160, strength: 0.7 },
};

/** One pass, start to clean. */
const DURATION = 380;

/**
 * VHS — analog interference as punctuation, only while an About transition
 * runs. The geometry has already started to move when it arrives; it clears
 * before the destination resolves, and the interface returns to its clean
 * base look.
 *
 * Everything here is transform and opacity on small or static layers, so a
 * pass is composited, never repainted:
 *   luma    a white sheet stepping between 0 and ~4% — the picture's
 *           brightness wobbling
 *   noise   the site's own grain at pass strength, jumping position each
 *           step — the snow of a tape between frames
 *   band    one tracking band rolling down: a thin backdrop blur with
 *           1px chroma fringes, the only colour the site ever shows
 *   tears   two hairlines at random heights, visible for a step or two
 *   head    the head-switch strip at the bottom edge
 * Stage content (globe, sculpture, About's page) jitters a few px sideways
 * through [data-vhs] on the stage. Nothing runs under reduced motion.
 */
export function Vhs({ state, still }: { state: State; still: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const { cue } = useSound();

  useEffect(() => {
    const el = root.current;
    const stage = el?.closest<HTMLElement>(".experience");
    if (!el || !stage || still || dev("NO_VHS")) return;
    const timers: number[] = [];

    const off = onVhs(({ delay, strength }) => {
      timers.push(window.setTimeout(() => {
        el.style.setProperty("--vhs-k", String(strength));
        el.style.setProperty("--vhs-t1", `${Math.round(18 + Math.random() * 30)}%`);
        el.style.setProperty("--vhs-t2", `${Math.round(55 + Math.random() * 30)}%`);
        el.style.setProperty("--vhs-b", `${Math.round(Math.random() * 30)}vh`);
        el.setAttribute("data-run", "");
        stage.setAttribute("data-vhs", "");
        cue("tape");
        timers.push(window.setTimeout(() => {
          el.removeAttribute("data-run");
          stage.removeAttribute("data-vhs");
        }, DURATION));
      }, delay));
    });

    return () => {
      off();
      timers.forEach((t) => window.clearTimeout(t));
      el.removeAttribute("data-run");
      stage.removeAttribute("data-vhs");
    };
  }, [still, cue]);

  useEffect(() => {
    if (still) return;
    const pass = PASSES[state];
    if (pass) triggerVhs(pass);
  }, [state, still]);

  return (
    <div ref={root} className="vhs" aria-hidden="true">
      <div className="vhs__luma" />
      <div className="vhs__noise" />
      <div className="vhs__band" />
      <i className="vhs__tear" data-t="1" />
      <i className="vhs__tear" data-t="2" />
      <div className="vhs__head" />
    </div>
  );
}
