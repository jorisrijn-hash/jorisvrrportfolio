"use client";

import { useRef, useState } from "react";
import { FOCUS } from "@/content/portfolio";

/**
 * WHAT I WORK WITH — typography that is alive, not a skills list.
 *
 * Six words, stepped across the page. The one under the pointer comes
 * forward, says what it actually means in a line of its own, and the others
 * step back; a small mark follows the pointer with lag while it does. The
 * technologies are underneath, as metadata, because the section is about how
 * the work is approached rather than which logos to collect.
 *
 * Every word is a button: it opens on hover, on focus and on click, so the
 * same interaction exists for a pointer, a keyboard and a thumb.
 */
export function Focus() {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

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
    <section className="section focus" id="focus">
      <div className="wrap head">
        <div className="head__top" data-reveal>
          <span className="m">{FOCUS.label}</span>
          <span className="rule" />
          <span className="m">{FOCUS.heading}</span>
        </div>
      </div>

      <div
        ref={root}
        className="focus__field"
        data-live={open || undefined}
        onPointerMove={track}
        onPointerLeave={() => setOpen(null)}
      >
        {/* the mark that follows the pointer while a word is open */}
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
            style={{ ["--i" as string]: i, ["--delay" as string]: `${i * 60}ms` }}
            aria-expanded={open === item.id}
            onPointerEnter={() => setOpen(item.id)}
            onFocus={() => setOpen(item.id)}
            onClick={() => setOpen(open === item.id ? null : item.id)}
          >
            <span className="focus__w d">{item.title}</span>
            <span className="focus__said">
              <span className="focus__line">{item.line}</span>
              <span className="focus__keys">
                {item.keywords.map((k) => <span key={k} className="m">{k}</span>)}
              </span>
            </span>
            {i === 0 ? <span className="focus__hint m" aria-hidden="true">← {FOCUS.hint}</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
