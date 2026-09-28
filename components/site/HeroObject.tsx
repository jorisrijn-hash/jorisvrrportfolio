"use client";

import { useEffect, useRef } from "react";

/**
 * The object in the middle of the words.
 *
 * There is no portrait in this project, and inventing one would be worse than
 * having none — so the centre of the hero is what the site is actually about:
 * a small system, drawn. A window with an architecture inside it, the same
 * shape as the diagrams in the case studies.
 *
 * It leans a few pixels toward the pointer. That is the whole interaction:
 * two custom properties written on a pointermove, coalesced into one frame.
 */
export function HeroObject() {
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
      x = (e.clientX / window.innerWidth - 0.5) * 34;
      y = (e.clientY / window.innerHeight - 0.5) * 22;
      if (!frame) frame = requestAnimationFrame(write);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="hero__object" aria-hidden="true">
      <svg viewBox="0 0 320 210" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="319" height="209" fill="#f2f1ed" stroke="#131311" />
        <path d="M0 22h320" stroke="#131311" />
        <circle cx="12" cy="11" r="2.5" fill="#131311" />
        <circle cx="22" cy="11" r="2.5" fill="#131311" opacity="0.35" />
        <circle cx="32" cy="11" r="2.5" fill="#131311" opacity="0.35" />

        {/* client -> api -> data, the shape every one of these systems has */}
        <g stroke="#131311" strokeWidth="1">
          <rect x="26" y="58" width="72" height="34" />
          <rect x="124" y="58" width="72" height="34" />
          <rect x="222" y="58" width="72" height="34" />
          <rect x="124" y="126" width="72" height="34" />
          <path d="M98 75h26M196 75h26M160 92v34" />
        </g>
        <g fill="#131311" fontFamily="ui-monospace, monospace" fontSize="7" letterSpacing="1.2">
          <text x="38" y="79">CLIENT</text>
          <text x="141" y="79">API</text>
          <text x="238" y="79">DATA</text>
          <text x="139" y="147">QUEUE</text>
        </g>
        <circle cx="222" cy="75" r="2.5" fill="#661f2c" />
        <g stroke="#131311" strokeWidth="1" opacity="0.28">
          <path d="M26 176h268M26 186h190M26 196h84" />
        </g>
      </svg>
    </div>
  );
}
