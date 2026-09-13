"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaLayer } from "./MediaLayer";
import { Pill } from "@/components/hud/Pill";
import { useExperience } from "@/lib/experience";
import { useSound } from "@/lib/sound";
import { PROJECTS, projectIndex } from "@/content/projects";

/**
 * WORK — reproduced from maintofeaturedwork.mp4's settled composition.
 *
 * Measured from the reference at 1920x950:
 *   panel        tilted quad, NW(224,124) SW(224,657) SE(1002,629) NE(1002,172)
 *                -> a rectangle with a perspective rotateY, not a skew
 *   right column starts x=1420; index in mono, title in SERIF (the reference
 *                does not set project titles in the display face)
 *   body box     x 1420-1858, y 340-512, accent rule on the left edge
 *   thumbs       x 1425-1860, y 552-632
 *   scrub        segmented, one segment per project, y~857
 *
 * WORK_IN plays the supplied transition; the settled state is real DOM so the
 * index, titles, thumbnails and controls stay interactive.
 */
export function WorkState({ phase }: { phase: "IN" | "SETTLED" | "OUT" }) {
  const { projectIndex: idx, setProject, go, busy } = useExperience();
  const { cue } = useSound();
  const project = PROJECTS[idx] ?? PROJECTS[0];
  const total = PROJECTS.length;

  const step = useCallback(
    (d: number) => {
      const next = (idx + d + total) % total;
      setProject(next);
      cue("index");
    },
    [idx, total, setProject, cue],
  );

  // Keyboard: arrows move between projects, Escape returns home.
  useEffect(() => {
    if (phase !== "SETTLED") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Escape") go("HOME");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, step, go]);

  return (
    <>
      <MediaLayer
        src="/media/maintofeaturedwork.mp4"
        poster="/media/work-poster.jpg"
        visible={phase === "IN"}
        restartOnShow
      />

      {phase === "SETTLED" ? (
        <div className="work" data-phase={phase}>
          {/* left: the tilted media panel */}
          <figure className="work__panel">
            <div className="work__panel-inner">
              {project.mediaType === "video" ? (
                <video src={project.mediaSrc} poster={project.posterSrc} muted loop playsInline autoPlay />
              ) : (
                <img src={project.mediaSrc} alt={project.title} />
              )}
            </div>
          </figure>

          {/* the small secondary plate at the lower left of the reference */}
          <figure className="work__aside" aria-hidden="true">
            <img src={project.mediaSrc} alt="" />
          </figure>

          <div className="work__viewport-map">Drv:// Viewport Map 1920x1080</div>
          <span className="work__ring" aria-hidden="true" />

          {/* right column */}
          <div className="work__info">
            <p className="work__eyebrow">Neural Node &middot; Work</p>
            <h2 className="work__title">
              <span className="work__index">{projectIndex(idx)}</span>
              <span className="work__slash">/</span>
              <span className="work__name">{project.title}</span>
            </h2>

            <div className="work__body">
              <p>{project.summary}</p>
            </div>

            <p className="work__hint">Index &middot; Scroll / Left focus</p>

            <ul className="work__thumbs">
              {PROJECTS.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="work__thumb"
                    aria-current={i === idx ? "true" : undefined}
                    aria-label={`${projectIndex(i)} ${p.title}`}
                    data-cursor-state="view"
                    onPointerEnter={() => cue("hover")}
                    onClick={() => {
                      setProject(i);
                      cue("select");
                    }}
                  >
                    <img src={p.posterSrc} alt="" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* bottom: scrub + controls */}
          <div className="work__scrub">
            <div className="work__scrub-head">
              <span>Work</span>
              <span>
                {projectIndex(idx)} / {String(total).padStart(2, "0")}
              </span>
            </div>
            <div className="work__segments" role="presentation">
              {PROJECTS.map((p, i) => (
                <span key={p.id} data-on={i <= idx} />
              ))}
            </div>
            <div className="work__rule" />
            <div className="work__controls">
              <span className="work__current">{project.title}</span>
              <div className="work__buttons">
                <Pill onClick={() => step(-1)} aria-label="Previous project" disabled={busy}>
                  <ChevronLeft size={12} strokeWidth={1.6} aria-hidden="true" />
                </Pill>
                <Pill onClick={() => step(1)} aria-label="Next project" disabled={busy}>
                  <ChevronRight size={12} strokeWidth={1.6} aria-hidden="true" />
                </Pill>
                <Pill onClick={() => cue("open")} disabled={busy}>
                  Case
                </Pill>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
