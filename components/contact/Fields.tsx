"use client";

import { useState } from "react";
import { REACH } from "@/content/contact";

const { items } = REACH.fields;

/**
 * WHAT I CAN HELP WITH — the site's own vocabulary, at the size it uses it.
 *
 * Five lines across the width, not five cards. Holding one brings up the
 * sentence that belongs to it and lets the others stand back, one at a time,
 * the same way What I Work With behaves on the index. The sentence is
 * supporting detail and nothing depends on reading it: the five words are
 * the answer to the question the heading asks, and they are always there.
 */
export function Fields() {
  const [on, setOn] = useState<string | null>(null);

  return (
    <ul className="reach__fields" data-live={on || undefined}>
      {items.map((f, i) => (
        <li
          key={f.id}
          className="reach__field"
          data-on={on === f.id || undefined}
          style={{ ["--i" as string]: i }}
        >
          {/* A button, because it answers to a tap and to a keyboard as well
              as to a pointer, and it is the row itself rather than something
              inside it. */}
          <button
            type="button"
            className="reach__field-hit"
            aria-expanded={on === f.id}
            onPointerEnter={(e) => e.pointerType === "mouse" && setOn(f.id)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setOn(null)}
            onFocus={() => setOn(f.id)}
            onBlur={() => setOn(null)}
            onClick={() => setOn(on === f.id ? null : f.id)}
          >
            <span className="d reach__field-t">{f.title}</span>
            <span className="reach__field-l">{f.line}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
