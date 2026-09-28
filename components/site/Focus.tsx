"use client";

import { useState } from "react";
import { FOCUS } from "@/content/portfolio";

/**
 * WHAT I WORK WITH.
 *
 * Five categories, stepped across the page rather than stacked flush. Opening
 * one shows what is actually inside it; the others step back. On a phone
 * there is no hover, so every row is simply open.
 *
 * Deliberately no imagery: there are two real projects on this site, and
 * decorating five categories with them would be five pictures pretending to
 * be evidence.
 */
export function Focus() {
  const [open, setOpen] = useState<string | null>(FOCUS.items[0].id);

  return (
    <section className="section focus">
      <div className="wrap head">
        <div className="head__top" data-reveal>
          <span className="m">{FOCUS.label}</span>
          <span className="rule" />
        </div>
        <h2 className="d mask" data-reveal><span>{FOCUS.heading}</span></h2>

        <div className="focus__list">
          {FOCUS.items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="focus__row"
              data-open={open === item.id || undefined}
              data-reveal
              style={{ ["--delay" as string]: `${i * 70}ms` }}
              aria-expanded={open === item.id}
              onPointerEnter={() => setOpen(item.id)}
              onFocus={() => setOpen(item.id)}
              onClick={() => setOpen(open === item.id ? null : item.id)}
            >
              <span className="focus__title">{item.title}</span>
              <span className="focus__keys">
                {item.keywords.map((k) => <span key={k} className="m">{k}</span>)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
