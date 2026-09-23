"use client";

import { useState } from "react";
import type { Decision } from "@/content/projects";
import { useSound } from "@/lib/sound";

/**
 * ENGINEERING DECISIONS — the reasoning, not the stack.
 *
 * Each one is a problem, the decision taken, how it was built and what it
 * changed. They open one at a time: the index stays readable, and a decision
 * is read as an argument rather than skimmed as a bullet. Every part except
 * the problem and the decision is optional, and an absent part leaves no gap.
 */
export function Decisions({ items }: { items: Decision[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const { cue } = useSound();

  return (
    <div className="dec">
      <ol className="dec__index" aria-label="Decisions">
        {items.map((d, i) => (
          <li key={d.id}>
            <button
              type="button"
              className="dec__pick"
              data-current={d.id === open || undefined}
              aria-expanded={d.id === open}
              aria-controls={`dec-${d.id}`}
              data-cursor="view"
              onPointerEnter={(e) => { if (e.pointerType === "mouse") cue("hover"); }}
              onClick={() => { cue(d.id === open ? "release" : "select"); setOpen(d.id === open ? null : d.id); }}
            >
              <span className="dec__n">{String(i + 1).padStart(2, "0")}</span>
              <span className="dec__area">{d.area}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="dec__list">
        {items.map((d, i) => (
          <article key={d.id} id={`dec-${d.id}`} className="dec__item" data-open={d.id === open || undefined}>
            <button
              type="button"
              className="dec__head"
              aria-expanded={d.id === open}
              onClick={() => { cue(d.id === open ? "release" : "select"); setOpen(d.id === open ? null : d.id); }}
            >
              <span className="dec__n">{String(i + 1).padStart(2, "0")}</span>
              <span className="dec__title">{d.area}</span>
              <span className="dec__mark" aria-hidden="true" />
            </button>
            <div className="dec__body">
              <div className="dec__inner">
                <p className="dec__label">{"// Problem"}</p>
                <p className="dec__text">{d.problem}</p>
                <p className="dec__label">{"// Decision"}</p>
                <p className="dec__text dec__text--lead">{d.decision}</p>
                {d.implementation ? (
                  <>
                    <p className="dec__label">{"// Implementation"}</p>
                    <p className="dec__text">{d.implementation}</p>
                  </>
                ) : null}
                {d.result ? (
                  <>
                    <p className="dec__label">{"// Result"}</p>
                    <p className="dec__text dec__text--result">{d.result}</p>
                  </>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
