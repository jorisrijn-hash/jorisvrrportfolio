"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ/\\<>—+*·";

/**
 * Text that resolves out of noise.
 *
 * React Bits' Decrypted Text, written into this site: the same idea, held
 * back to something quiet. It settles left to right, a couple of characters
 * at a time, over well under a second, and the scrambled state uses the same
 * restrained set of marks the rest of the interface uses rather than a wall
 * of symbols. It runs once, when the line is reached.
 *
 * The real text is always in the document — the animation only replaces what
 * is painted — so it is selectable, searchable and read aloud correctly even
 * while it is still settling.
 */
export function Decrypt({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let started = false;
    const io = new IntersectionObserver(
      (entries, obs) => {
        if (!entries.some((e) => e.isIntersecting) || started) return;
        started = true;
        obs.disconnect();

        const chars = [...text];
        const start = performance.now();
        const per = 34;                         // ms each character is held
        const tick = (now: number) => {
          const settled = Math.floor((now - start) / per);
          if (settled >= chars.length) {
            setShown(text);
            return;
          }
          setShown(
            chars
              .map((c, i) =>
                i < settled || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0],
              )
              .join(""),
          );
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [text]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
