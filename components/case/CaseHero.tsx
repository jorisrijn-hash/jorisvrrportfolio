"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Project } from "@/content/projects";
import { stillSet } from "@/content/work";
import { useReducedMotion } from "@/lib/motion";
import { useSound } from "@/lib/sound";

/**
 * THE HERO — what the Work surface becomes.
 *
 * Arriving from the environment, the media is already on screen and in place:
 * this rectangle is where it lands, so the hero must not re-animate it, only
 * take it over. Arriving from a URL there is nothing to take over, so the
 * same rectangle resolves by itself, shortened.
 */
export function CaseHero({
  project: p,
  arrival,
  onBack,
}: {
  project: Project;
  arrival: "carried" | "direct";
  onBack?: () => void;
}) {
  const { cue } = useSound();
  const reduced = useReducedMotion();
  const fig = useRef<HTMLElement>(null);
  const media = p.heroMedia ?? p.showcaseMedia;
  // The column this figure fills, so the browser can pick the file.
  const src = stillSet(media, "(max-width: 900px) 100vw, min(1100px, 100vw - 120px)");
  const hover = (e: React.PointerEvent) => { if (e.pointerType === "mouse") cue("hover"); };

  /**
   * Carried arrival: the Work surface has just grown to fill the screen, and
   * this figure is standing in the same pixels. Measure where the figure
   * belongs, start it from the full screen, and let it settle into the page —
   * the image never moves at the moment of handover, only afterwards.
   */
  useLayoutEffect(() => {
    if (arrival !== "carried" || reduced) return;
    const el = fig.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const s = Math.max(window.innerWidth / r.width, window.innerHeight / r.height);
    const dx = window.innerWidth / 2 - (r.left + r.width / 2);
    const dy = window.innerHeight / 2 - (r.top + r.height / 2);
    const anim = el.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: "none" }],
      { duration: 780, easing: "cubic-bezier(0.45, 0, 0.2, 1)", fill: "both" },
    );
    const done = () => anim.cancel();
    anim.finished.then(done, () => {});
    return () => anim.cancel();
  }, [arrival, reduced]);

  return (
    <header className="case-hero" data-arrival={arrival}>
      <div className="case-hero__bar">
        {onBack ? (
          <button type="button" className="case-back" data-cursor="back" onPointerEnter={hover} onClick={() => { cue("release"); onBack(); }}>
            <ArrowLeft size={12} strokeWidth={1.6} aria-hidden="true" />
            Work
          </button>
        ) : (
          // Reached by its own URL: leaving is a real navigation back into
          // the environment. The flag is the promise this link makes — the
          // experience reads it and goes on to Work rather than stopping at
          // Home (components/experience/Experience.tsx).
          <Link
            className="case-back"
            href="/"
            data-cursor="back"
            onPointerEnter={hover}
            onClick={() => {
              cue("release");
              try { sessionStorage.setItem("jvr.open", "work"); } catch {}
            }}
          >
            <ArrowLeft size={12} strokeWidth={1.6} aria-hidden="true" />
            Work
          </Link>
        )}
        <p className="case-hero__system">
          {"Case study"} <span aria-hidden="true">·</span> {p.number}
        </p>
      </div>

      <div className="case-hero__identity">
        <h1 className="case-hero__title">{p.title}</h1>
        {p.subtitle ? <p className="case-hero__sub">{p.subtitle}</p> : null}
        <dl className="case-hero__meta">
          <div><dt>Type</dt><dd>{p.type}</dd></div>
          {p.role?.length ? <div><dt>Role</dt><dd>{p.role.join(" / ")}</dd></div> : null}
          {p.year ? <div><dt>Year</dt><dd>{p.year}</dd></div> : null}
        </dl>
        {p.technologies?.length ? (
          <ul className="case-hero__stack" aria-label="Stack">
            {p.technologies.map((t) => <li key={t}>{t}</li>)}
          </ul>
        ) : null}
        {p.liveUrl || p.githubUrl ? (
          <p className="case-hero__links">
            {p.liveUrl ? (
              <a href={p.liveUrl} target="_blank" rel="noreferrer noopener" data-cursor="view" onPointerEnter={hover}>
                Live<ArrowUpRight size={11} strokeWidth={1.6} aria-hidden="true" />
              </a>
            ) : null}
            {p.githubUrl ? (
              <a href={p.githubUrl} target="_blank" rel="noreferrer noopener" data-cursor="view" onPointerEnter={hover}>
                Source<ArrowUpRight size={11} strokeWidth={1.6} aria-hidden="true" />
              </a>
            ) : null}
          </p>
        ) : null}
      </div>

      {/* The surface. Nothing invented in its place: a project without media
          simply has none here either. */}
      {src ? (
        <figure ref={fig} className="case-hero__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src.src}
            srcSet={src.srcSet}
            sizes={src.sizes}
            alt={media?.alt ?? ""}
            width={media?.width}
            height={media?.height}
            decoding="async"
            draggable={false}
          />
          {media?.isPlaceholder ? <figcaption>{"// Placeholder media"}</figcaption> : null}
        </figure>
      ) : null}
    </header>
  );
}
