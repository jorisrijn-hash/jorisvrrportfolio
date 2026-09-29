"use client";

import { useEffect, useRef } from "react";
import { IDENTITY } from "@/content/portfolio";

/**
 * The portrait, which is the pointer while the pointer is in the hero.
 *
 * At rest it sits in the middle of the words, small on purpose: the
 * typography is the hero and this is the interruption inside it. Bring a
 * pointer into the hero and the portrait comes to meet it and then carries
 * it, riding over the lines with weight behind it rather than snapping to
 * the cursor. Take the pointer out and it finds its way back to the middle.
 *
 * The crosshair stands down for as long as this is leading: there is one
 * pointer on screen, and here it is a face.
 *
 * The signal breaks up as it arrives, two colour channels pulling apart in a
 * couple of thin bands, and then again now and then while it is carrying,
 * small enough to be noticed rather than watched. At rest it is completely
 * clean, and with reduced motion or without a real pointer it never moves at
 * all: it simply stays in the middle, and the crosshair keeps its job.
 */
export function HeroPortrait() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine) and (hover: hover)").matches) return;
    const hero = el.closest<HTMLElement>(".hero");
    if (!hero) return;

    const root = document.documentElement;
    let frame = 0;
    let lead = false;
    /* where the pointer is, in the page's own coordinates, so that scrolling
       under a still pointer does not drag the portrait along with the hero */
    let px = 0;
    let py = 0;
    let x = 0;      // where the portrait is, relative to the hero's centre
    let y = 0;

    const step = () => {
      frame = 0;
      let tx = 0;
      let ty = 0;
      if (lead) {
        const r = hero.getBoundingClientRect();
        tx = px - (r.left + r.width / 2);
        ty = py - (r.top + r.height / 2);
      }
      // Coming is quicker than going: it answers a pointer, and it takes its
      // time finding the middle again.
      const k = lead ? 0.13 : 0.06;
      x += (tx - x) * k;
      y += (ty - y) * k;
      el.style.setProperty("--px", `${x.toFixed(1)}px`);
      el.style.setProperty("--py", `${y.toFixed(1)}px`);
      // While leading it keeps running even when the pointer is still, because
      // the hero can scroll out from under it. On the way home it stops as
      // soon as there is nothing left to travel.
      if (lead || Math.abs(x) > 0.4 || Math.abs(y) > 0.4) {
        frame = requestAnimationFrame(step);
      } else {
        el.style.setProperty("--px", "0px");
        el.style.setProperty("--py", "0px");
        delete el.dataset.live;
      }
    };
    const run = () => { if (!frame) frame = requestAnimationFrame(step); };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
    };
    // one burst on arrival, then the quieter loop takes over (CSS)
    const burst = () => {
      el.dataset.burst = "";
      window.setTimeout(() => el?.removeAttribute("data-burst"), 620);
    };
    const take = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || lead) return;
      lead = true;
      px = e.clientX;
      py = e.clientY;
      el.dataset.live = "";
      el.dataset.lead = "";
      root.dataset.heroCursor = "on";
      burst();
      run();
    };
    const release = () => {
      if (!lead) return;
      lead = false;
      delete el.dataset.lead;
      delete root.dataset.heroCursor;
      run();
    };

    hero.addEventListener("pointerenter", take);
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", release);
    window.addEventListener("blur", release);
    return () => {
      hero.removeEventListener("pointerenter", take);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", release);
      window.removeEventListener("blur", release);
      delete root.dataset.heroCursor;
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="hero__portrait">
      <img
        src="/portrait-820.webp"
        srcSet="/portrait-480.webp 480w, /portrait-820.webp 820w"
        sizes="(max-width: 900px) 26vw, 11vw"
        width={820}
        height={1025}
        alt={`${IDENTITY.name}, portrait`}
        fetchPriority="high"
        decoding="async"
      />
      {/* the two channels that pull apart. They are the same photograph,
          reduced to one colour each and screened back together, so at rest
          they add up to exactly the image underneath. */}
      <span className="hero__ch" data-ch="r" aria-hidden="true" />
      <span className="hero__ch" data-ch="c" aria-hidden="true" />
    </div>
  );
}
