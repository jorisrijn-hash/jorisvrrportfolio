"use client";

import { useEffect, useRef } from "react";
import { IDENTITY } from "@/content/portfolio";

/**
 * The portrait, in the middle of the words.
 *
 * It leans a few pixels toward the pointer — that is the whole interaction:
 * two custom properties written on a pointermove, coalesced into one frame.
 * No lean on a touch screen, and none at all under reduced motion.
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

  return (
    <div ref={ref} className="hero__portrait">
      <img
        src="/portrait-820.webp"
        srcSet="/portrait-480.webp 480w, /portrait-820.webp 820w"
        sizes="(max-width: 900px) 46vw, 24vw"
        width={820}
        height={1025}
        alt={IDENTITY.name}
        fetchPriority="high"
        decoding="async"
      />
    </div>
  );
}
