"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import { FEATURED, hasCaseStudy } from "@/content/projects";
import { computeLayout } from "@/lib/layout";
import { useSound } from "@/lib/sound";

/**
 * FEATURED WORK — a system notification that surfaces one piece of work.
 *
 * It is not a state. Home keeps running behind it, the sculpture keeps its
 * place in the middle of the screen, and only a subset of its geometry flies
 * out to build the small display set into this panel (WorkStage
 * variant="spotlight"; the rectangle both sides use is lib/layout
 * `spotlight`). What is here is the frame around that display, the identity
 * beside it and one action under it — nothing that is not confirmed by
 * content/projects.ts.
 *
 *   data-x-spotlight   the formation is running (raised by WorkStage)
 *   data-sp-ui         the display has locked: identity may resolve
 */
export function Spotlight({
  closing,
  leaving = false,
  onClose,
  onSeeAll,
}: {
  closing: boolean;
  /** the surface is on its way into the Work environment: the frame lets go */
  leaving?: boolean;
  onClose: () => void;
  onSeeAll: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const { cue } = useSound();
  const p = FEATURED;

  // The panel is placed in viewport px (lib/layout `notification`), so it is
  // anchored to the screen the way a notification is — not to the sculpture.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const { panel, plane } = computeLayout().spotlight;
      const L = computeLayout();
      const set = (k: string, v: number) => el.style.setProperty(k, `${Math.round(v)}px`);
      set("--sp-x", panel.x);
      set("--sp-y", panel.y);
      set("--sp-w", panel.w);
      set("--sp-h", panel.h);
      set("--sp-pad", panel.pad);
      set("--sp-head", panel.head);
      set("--sp-foot", panel.foot);
      // the display bay: the same rectangle the cubes fly to
      set("--sp-mw", plane.w * L.fit);
      set("--sp-mh", plane.h * L.fit);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Focus is NOT taken. This surfaces itself, unasked, while the interface
  // stays usable — so it joins the tab order and announces itself politely
  // instead of interrupting whatever the visitor was doing. Escape still
  // closes it (the stage owns that), and tabbing or clicking into it works
  // normally.

  const hover = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") cue("hover");
  };

  const roles = p.role?.length ? p.role.join(" / ") : null;
  const caseStudyReady = hasCaseStudy(p);

  return (
    <section
      ref={root}
      className="spotlight"
      data-closing={closing || undefined}
      data-leaving={leaving || undefined}
      aria-label={`Featured work: ${p.title}`}
      aria-live="polite"
    >
      <div className="sp">
        {/* registration marks, as everywhere else in this interface */}
        <span className="sp__mark" data-c="tl" aria-hidden="true" />
        <span className="sp__mark" data-c="tr" aria-hidden="true" />
        <span className="sp__mark" data-c="bl" aria-hidden="true" />
        <span className="sp__mark" data-c="br" aria-hidden="true" />

        <header className="sp__head">
          <p className="sp__label">
            Featured work
            <span className="sp__rule" aria-hidden="true" />
            <span className="sp__n">{p.number}</span>
          </p>
          <button
            type="button"
            className="sp__close"
            onPointerEnter={hover}
            onClick={onClose}
            aria-label="Close featured work"
            data-cursor="back"
          >
            <X size={11} strokeWidth={1.7} aria-hidden="true" />
          </button>
        </header>

        <div className="sp__body">
          {/* The display bay. The surface itself is the Work stage, which
              lands exactly here — this is the frame it sits in. */}
          <span className="sp__bay" aria-hidden="true" />

          <div className="sp__identity">
            <h2 className="sp__title"><span>{p.title}</span></h2>
            <p className="sp__type">{p.type}</p>
            {roles ? <p className="sp__roles">{roles}</p> : null}
          </div>
        </div>

        <footer className="sp__foot">
          <button
            type="button"
            className="sp__cta"
            data-primary
            data-cursor="work"
            onPointerEnter={hover}
            onClick={() => { cue("state"); onSeeAll(); }}
          >
            See all featured work
            <ArrowRight size={12} strokeWidth={1.6} aria-hidden="true" />
          </button>

          {caseStudyReady ? (
            <a
              className="sp__cta"
              href={`/work/${p.slug}`}
              data-cursor="view"
              onPointerEnter={hover}
              onClick={() => cue("select")}
            >
              View case study
              <ArrowUpRight size={11} strokeWidth={1.6} aria-hidden="true" />
            </a>
          ) : (
            // Nothing is claimed until the case study exists.
            <p className="sp__cta" data-pending>{"// In preparation"}</p>
          )}
        </footer>
      </div>
    </section>
  );
}
