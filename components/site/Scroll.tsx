"use client";

import { useEffect } from "react";

/**
 * THE PAGE'S ONE SCROLL DRIVER.
 *
 * Everything that reacts to scrolling on this site goes through here, so
 * there is exactly one listener and exactly one rAF, whatever the page grows
 * into:
 *
 *   [data-reveal]    marked as reached, once, then forgotten (observer)
 *   [data-track]     given `--p`, its own 0 -> 1 progress through the
 *                    viewport, for anything that should move WITH the scroll
 *                    rather than simply appear
 *   .descent         given `--n`, and the stage attributes that carry the
 *                    page from its light state into its dark one
 *
 * Only custom properties are written, and only when they change by a
 * hundredth — the styles that consume them are transforms, opacities and
 * colour mixes, so a frame costs a handful of property writes.
 */
export function Scroll() {
  useEffect(() => {
    /* ---- reveals: seen once, then released ------------------------------ */
    const revealed = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).dataset.reveal = "in";
          obs.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.06 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => revealed.observe(el));

    /* ---- scroll-linked: only what is on screen is measured --------------- */
    const tracked = [...document.querySelectorAll<HTMLElement>("[data-track]")];
    const descent = document.querySelector<HTMLElement>(".descent");
    /* The page's change of state is driven by one empty stretch, not by the
       whole tail: the low-contrast middle of any light-to-dark change has to
       land somewhere there is nothing to read. */
    const fall = document.querySelector<HTMLElement>("[data-fall]");
    const live = new Set<HTMLElement>();
    const near = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            live.add(el);
            return;
          }
          live.delete(el);
          // Leaving the viewport is a value too: something that has gone past
          // the top is finished, not merely unobserved — otherwise the page
          // would sit for ever at whatever it read on the way out.
          if (el !== fall) set(el, "--p", e.boundingClientRect.top < 0 ? 1 : 0);
        });
        request();
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    tracked.forEach((el) => near.observe(el));

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    const set = (el: HTMLElement, name: string, v: number) => {
      const q = Math.round(v * 100) / 100;
      if (el.dataset[name === "--p" ? "p" : "n"] === String(q)) return;
      el.dataset[name === "--p" ? "p" : "n"] = String(q);
      el.style.setProperty(name, String(q));
    };

    const read = () => {
      frame = 0;
      const vh = window.innerHeight;
      // The page's state is read every frame whether or not the stretch that
      // drives it is on screen, so jumping (a hash link, a restored
      // position, a keyboard End) lands in the right world rather than in
      // whatever was last seen.
      if (fall && descent) {
        const r = fall.getBoundingClientRect();
        let p = Math.min(1, Math.max(0, (vh * 0.5 - r.top) / (r.height * 0.8)));
        if (still) p = p > 0.5 ? 1 : 0;
        set(descent, "--n", p);
        descent.dataset.rules = p > 0.32 ? "night" : "day";
        descent.dataset.ink = p > 0.5 ? "night" : "day";
        // The navigation reads by inverting against what is behind it, which
        // works over paper and over black but has nothing to invert against
        // while the ground is passing through the middle greys. For that
        // stretch only, it is given an explicit colour instead — dark while
        // the ground is still light, light once it is not.
        document.documentElement.dataset.nav =
          p < 0.3 ? "day" : p < 0.52 ? "on-light" : p < 0.72 ? "on-dark" : "night";
      }
      live.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (el === fall) return;      // measured above, every frame
        // an element's own travel through the viewport, 0 entering -> 1 gone
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        set(el, "--p", p);
      });
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    read();

    return () => {
      revealed.disconnect();
      near.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
