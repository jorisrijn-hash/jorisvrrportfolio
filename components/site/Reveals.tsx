"use client";

import { useEffect } from "react";

/**
 * ONE observer for the whole page.
 *
 * Every section is plain server-rendered HTML; the only thing that needs a
 * browser is knowing when an element has been reached. So a single
 * IntersectionObserver marks `[data-reveal]` elements as they arrive and then
 * forgets them — no scroll listener, no per-frame work, and no client
 * component around each section.
 */
export function Reveals() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (!els.length) return;

    // Anything already on screen at load is simply there, un-animated: an
    // entrance the visitor did not scroll to is just a delay.
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).dataset.reveal = "in";
          obs.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
