"use client";

import { useRef, useState } from "react";
import { FOCUS } from "@/content/portfolio";

/**
 * WHAT I WORK WITH — a typographic landscape, not a list.
 *
 * The six words are placed across the width of the screen rather than down
 * it: different lanes, different sizes, two of them running past the edges.
 * The one under the pointer comes forward and the rest recede, and what it
 * means is read out along the bottom of the screen — so the landscape itself
 * never reflows while it is being explored.
 *
 * Hover, focus and click all make a word active, so a pointer, a keyboard
 * and a thumb all get the same thing.
 */
export function Focus() {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const live = FOCUS.items.find((i) => i.id === open) ?? null;

  // the mark that trails the pointer — two properties, one frame
  const frame = useRef(0);
  const pos = useRef({ x: 0, y: 0 });
  const track = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = root.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pos.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      el.style.setProperty("--mx", `${pos.current.x}px`);
      el.style.setProperty("--my", `${pos.current.y}px`);
    });
  };

  return (
    <section className="focus" id="focus">
      <div className="focus__label" data-reveal>
        <span className="m">{FOCUS.label}</span>
        <span className="m">{FOCUS.heading}</span>
      </div>

      <div
        ref={root}
        className="focus__field"
        data-track
        data-live={open || undefined}
        onPointerMove={track}
        onPointerLeave={() => setOpen(null)}
      >
        <span className="focus__mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="23" stroke="currentColor" />
            <path d="M24 8v32M8 24h32" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
            <circle cx="24" cy="24" r="3.5" fill="currentColor" />
          </svg>
        </span>

        {FOCUS.items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className="focus__word"
            data-open={open === item.id || undefined}
            data-reveal
            data-cursor="text"
            style={{ ["--i" as string]: i, ["--delay" as string]: `${i * 70}ms` }}
            aria-expanded={open === item.id}
            onPointerEnter={() => setOpen(item.id)}
            onFocus={() => setOpen(item.id)}
            onClick={() => setOpen(open === item.id ? null : item.id)}
          >
            <span className="focus__w d">{item.title}</span>
            {/* the meaning is read out below; this is the same thing, said */}
            <span className="sr-only">{item.line} — {item.keywords.join(", ")}</span>
          </button>
        ))}

        {/* the one hint on the site */}
        <span className="focus__hint m" aria-hidden="true">← {FOCUS.hint}</span>

        {/* the readout: it changes, the landscape does not move */}
        <div className="focus__read" aria-hidden="true" data-on={live ? "" : undefined}>
          <span className="focus__line">{live?.line}</span>
          <span className="focus__keys">
            {live?.keywords.map((k) => <span key={k} className="m">{k}</span>)}
          </span>
        </div>
      </div>
    </section>
  );
}
