"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { FEATURED, hasCaseStudy } from "@/content/projects";
import { computeLayout } from "@/lib/layout";
import { useSound } from "@/lib/sound";

/**
 * FEATURED WORK — the text side of the spotlight.
 *
 * The SURFACE is not here: it is the Work surface itself, scaled and set
 * aside (WorkStage variant="spotlight"), assembled by the sculpture's own
 * cubes. This is the identity and the actions around it, revealed by the
 * stage attributes that the formation raises — so nothing here renders per
 * frame, and the copy is only what content/projects.ts actually confirms.
 *
 *   data-x-spotlight   the formation is running (raised by WorkStage)
 *   data-sp-ui         the surface has locked: identity may resolve
 */
export function Spotlight({
  closing,
  onClose,
  onSeeAll,
}: {
  closing: boolean;
  onClose: () => void;
  onSeeAll: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { cue } = useSound();
  const p = FEATURED;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const L = computeLayout();
      el.style.setProperty("--fit", String(L.fit));
      el.style.setProperty("--stage-y", `${L.stageY * 100}%`);
      // where the surface ends, so the compact composition sits under it
      el.style.setProperty("--sp-media-bottom", `${Math.round(L.vh * L.stageY + (L.spotlight.plane.y + L.spotlight.plane.h) * L.fit)}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Focus the surfaced project once, so a keyboard lands inside it; Escape is
  // handled by the stage (Experience), which owns the state.
  useEffect(() => {
    if (!closing) root.current?.focus({ preventScroll: true });
  }, [closing]);

  const hover = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") cue("hover");
  };

  const roles = p.role?.length ? p.role.join(" / ") : null;
  const stack = p.technologies?.length ? p.technologies.join(" · ") : null;
  const caseStudyReady = hasCaseStudy(p);

  return (
    <section
      ref={root}
      className="spotlight"
      data-closing={closing || undefined}
      aria-label={`Featured work: ${p.title}`}
      tabIndex={-1}
    >
      <p className="spotlight__system">
        <span className="spotlight__rule" aria-hidden="true" />
        Featured work
        <span className="spotlight__index">{`${p.number} / Selected`}</span>
      </p>

      <div className="spotlight__identity">
        <h2 className="spotlight__title"><span>{p.title}</span></h2>
        <p className="spotlight__type">{p.type}</p>
        {roles ? <p className="spotlight__roles">{roles}</p> : null}
        {stack ? <p className="spotlight__stack">{stack}</p> : null}

        <div className="spotlight__actions">
          {caseStudyReady ? (
            <a
              className="spotlight__cta"
              href={`/work/${p.slug}`}
              data-cursor="view"
              onPointerEnter={hover}
              onClick={() => cue("select")}
            >
              View case study
              <ArrowUpRight size={12} strokeWidth={1.6} aria-hidden="true" />
            </a>
          ) : (
            // The case study is built in the next checkpoint; until it holds
            // something real, this says so rather than opening an empty page.
            <span className="spotlight__cta" data-pending aria-disabled="true">
              Case study
              <span className="spotlight__pending">{"// In preparation"}</span>
            </span>
          )}

          <button
            type="button"
            className="spotlight__cta spotlight__cta--all"
            data-cursor="work"
            onPointerEnter={hover}
            onClick={onSeeAll}
          >
            See all featured work
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        className="spotlight__close"
        onPointerEnter={hover}
        onClick={onClose}
        aria-label="Close featured work"
        data-cursor="back"
      >
        <X size={12} strokeWidth={1.7} aria-hidden="true" />
        <span>Close</span>
      </button>
    </section>
  );
}
