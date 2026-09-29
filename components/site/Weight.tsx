"use client";

import { useEffect } from "react";

/**
 * THE WEIGHT OF THE PAGE.
 *
 * The viewport is given some mass: a wheel does not move the page, it moves a
 * target, and the page eases toward that target one frame at a time. Input
 * accelerates it, letting go decelerates it, and it settles rather than
 * stopping.
 *
 * It drives the REAL scroll position rather than translating a wrapper, which
 * is the whole reason it can exist here at all: `position: sticky` (the work
 * marker), `position: fixed` (the navigation, the night layer, the
 * crosshair) and anchor links all keep working exactly as they did.
 *
 * It bows out completely for anything it would be wrong to take over —
 * reduced motion, touch, a pinch, a page that fits the screen — and in those
 * cases the browser's own scrolling is left alone.
 */
const EASE = 0.085;          // how much of the remaining distance per frame
const SETTLE = 0.4;          // px: close enough to stop

export function Weight() {
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    if (still.matches || coarse.matches) return;

    const root = document.documentElement;
    // the page drives itself from here, so the browser's own smoothing —
    // which would fight it every frame — is turned off
    const priorBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    let target = window.scrollY;
    let frame = 0;
    let driving = false;

    const max = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const run = () => {
      const current = window.scrollY;
      const delta = target - current;
      if (Math.abs(delta) < SETTLE) {
        window.scrollTo(0, target);
        frame = 0;
        driving = false;
        return;
      }
      window.scrollTo(0, current + delta * EASE);
      frame = requestAnimationFrame(run);
    };

    const start = () => {
      driving = true;
      if (!frame) frame = requestAnimationFrame(run);
    };

    const onWheel = (e: WheelEvent) => {
      // a pinch, or a gesture the browser owns: hands off
      if (e.ctrlKey || e.defaultPrevented) return;
      e.preventDefault();
      // lines and pages, in the units the browser actually reported
      const step = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      target = Math.min(max(), Math.max(0, target + e.deltaY * step));
      start();
    };

    // anything that is not the wheel — a key, a scrollbar, a hash link, the
    // browser restoring a position — owns the scroll, so the target follows it
    const onScroll = () => { if (!driving) target = window.scrollY; };
    const onResize = () => { target = Math.min(max(), window.scrollY); };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
      root.style.scrollBehavior = priorBehavior;
    };
  }, []);

  return null;
}
