"use client";

import { useEffect, useRef } from "react";
import { IDENTITY } from "@/content/portfolio";

/**
 * The portrait, in the middle of the words.
 *
 * It is small on purpose: the typography is the hero and this is the
 * interruption inside it. It leans a few pixels toward the pointer, and when
 * the pointer reaches it the signal breaks up for a moment, two colour
 * channels pulling apart in a couple of thin bands before it settles. While
 * the pointer stays, that happens again now and then, small enough to be
 * noticed rather than watched.
 *
 * At rest it is completely clean, and with reduced motion it stays that way.
 */
export function HeroPortrait() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const write = () => {
      frame = 0;
      el.style.setProperty("--px", `${x.toFixed(1)}px`);
      el.style.setProperty("--py", `${y.toFixed(1)}px`);
    };
    const onMove = (e: PointerEvent) => {
      x = (e.clientX / window.innerWidth - 0.5) * 30;
      y = (e.clientY / window.innerHeight - 0.5) * 20;
      if (!frame) frame = requestAnimationFrame(write);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // one burst on arrival, then the quieter loop takes over (CSS)
  const burst = () => {
    const el = ref.current;
    if (!el) return;
    el.dataset.burst = "";
    window.setTimeout(() => el?.removeAttribute("data-burst"), 620);
  };

  return (
    <div
      ref={ref}
      className="hero__portrait"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") burst(); }}
    >
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
