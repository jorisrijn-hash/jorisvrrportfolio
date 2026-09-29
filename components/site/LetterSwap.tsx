"use client";

import { useRef } from "react";

/**
 * A word whose letters turn over.
 *
 * Each letter is a small box carrying the same character twice — one facing
 * the reader, one below it, turned up out of sight. Rolling the box on its X
 * axis swaps them, one letter after the next. The effect is React Bits' 3D
 * Letter Swap; this is that idea written into this site's own system, so it
 * shares its easing, its stagger and its reduced-motion rule rather than
 * arriving with a component library's.
 *
 * It is a hover on a heading, so it is never the thing that delivers the
 * text: the word is readable and selectable whether or not anything turns.
 */
export function LetterSwap({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      className={`swap${className ? ` ${className}` : ""}`}
      data-cursor="text"
      onPointerEnter={() => ref.current?.setAttribute("data-turn", "")}
      onTransitionEnd={() => ref.current?.removeAttribute("data-turn")}
    >
      {[...text].map((ch, i) => (
        <span key={i} className="swap__l" style={{ ["--i" as string]: i }} aria-hidden={i > 0 || undefined}>
          <span className="swap__box">
            <span className="swap__face">{ch === " " ? " " : ch}</span>
            <span className="swap__face swap__face--under">{ch === " " ? " " : ch}</span>
          </span>
        </span>
      ))}
      {/* the word itself, for anything that reads rather than looks */}
      <span className="sr-only">{text}</span>
    </span>
  );
}
