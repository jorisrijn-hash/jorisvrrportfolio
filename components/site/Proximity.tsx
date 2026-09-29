"use client";

import { useEffect, useRef } from "react";

/**
 * A word whose letters answer the pointer.
 *
 * Archivo carries a weight axis and a width axis, so the closer the pointer
 * comes to a letter the heavier and wider it is set. It is React Bits'
 * Variable Proximity, written against the typeface this site already loads:
 * nothing is added to the page, the text is real text, and only the letters
 * of the word actually being explored are touched.
 *
 * It runs only while the pointer is inside the word, and not at all for a
 * touch screen or reduced motion.
 */
export function Proximity({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const at = useRef({ x: 0, y: 0 });

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); }, []);

  const apply = () => {
    frame.current = 0;
    const el = ref.current;
    if (!el) return;
    const letters = el.children;
    const reach = 150;
    for (let i = 0; i < letters.length; i++) {
      const l = letters[i] as HTMLElement;
      const r = l.getBoundingClientRect();
      const dx = at.current.x - (r.left + r.width / 2);
      const dy = at.current.y - (r.top + r.height / 2);
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
      // 800 -> 900 in weight, 66 -> 84 in width: felt, not announced
      l.style.fontVariationSettings = `"wght" ${(800 + near * 100).toFixed(0)}, "wdth" ${(66 + near * 18).toFixed(0)}`;
    }
  };

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    at.current = { x: e.clientX, y: e.clientY };
    if (!frame.current) frame.current = requestAnimationFrame(apply);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    for (const l of [...el.children] as HTMLElement[]) l.style.fontVariationSettings = "";
  };

  return (
    <span ref={ref} className={className} onPointerMove={move} onPointerLeave={reset}>
      {[...text].map((ch, i) => (
        <span key={i} className="prox__l">{ch === " " ? " " : ch}</span>
      ))}
    </span>
  );
}
