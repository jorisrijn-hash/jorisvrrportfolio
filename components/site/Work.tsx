"use client";

import { useEffect, useRef, useState } from "react";
import { FEATURED, WORK_INTRO } from "@/content/portfolio";

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M1 6.5h10M7 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

/**
 * SELECTED WORK — a chapter, not a list.
 *
 * "Selected work" is small and pinned near the middle of the screen. It stays
 * there while the projects travel past it, and its counter turns over as each
 * one arrives: the label is the marker on a sequence the visitor scrolls
 * through, rather than a heading above a stack of cards.
 *
 * It blends against whatever passes under it, so it survives crossing a
 * photograph without needing a box to sit in.
 *
 * Each project is given its own screen-sized moments — number, then title,
 * then the image, then what is true about it — with enough empty space
 * between them that the sequence has somewhere to breathe.
 */
export function Work() {
  const [at, setAt] = useState(0);
  const root = useRef<HTMLElement>(null);

  // Which project the marker is counting. One observer, no scroll handler.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const marks = [...el.querySelectorAll<HTMLElement>("[data-project]")];
    const io = new IntersectionObserver(
      () => {
        const mid = window.innerHeight / 2;
        let i = 0;
        marks.forEach((m, k) => {
          const r = m.getBoundingClientRect();
          if (r.top <= mid) i = k;
        });
        setAt(i);
      },
      { threshold: [0, 0.2, 0.5, 0.8, 1], rootMargin: "-40% 0px -40% 0px" },
    );
    marks.forEach((m) => io.observe(m));
    return () => io.disconnect();
  }, []);

  return (
    <section className="work" id="work" ref={root}>
      {/* the marker: small, quiet, and pinned while the work moves past */}
      <div className="work__marker" aria-hidden="true">
        <span className="m">{WORK_INTRO.marker}</span>
        <span className="m work__count">
          <span data-at={at === 0 || undefined}>01</span>
          <span className="work__slash">/</span>
          <span data-at={at === 1 || undefined}>02</span>
        </span>
      </div>

      {FEATURED.map((p, i) => (
        <article key={p.slug} className="work__project" data-project={i}>
          <div className="wrap">
            <p className="work__num m" data-reveal>{p.number}</p>

            <h2 className="work__title d" data-reveal>
              {p.title.map((line) => (
                <span key={line} className="mask"><span>{line}</span></span>
              ))}
            </h2>

            <p className="work__kind m" data-reveal>{p.kind} · {p.year}</p>
          </div>

          {/* the visual takes the width; it uncovers itself as it arrives */}
          <figure className="work__figure" data-reveal data-track>
            <img
              src={`${p.media.src}-1680.webp`}
              srcSet={`${p.media.src}-960.webp 960w, ${p.media.src}-1680.webp 1680w`}
              sizes="(max-width: 900px) 100vw, 78vw"
              alt={p.media.alt}
              width={1680}
              height={1074}
              loading="lazy"
              decoding="async"
            />
          </figure>
          <p className="wrap m work__caption" data-reveal>{p.media.caption}</p>

          <div className="wrap work__read">
            <p className="work__summary" data-reveal>{p.summary}</p>
            <dl className="work__meta" data-reveal style={{ ["--delay" as string]: "90ms" }}>
              {p.meta.map((m) => (
                <div key={m.label}>
                  <dt className="m">{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
            <p data-reveal style={{ ["--delay" as string]: "180ms" }}>
              <a
                className="action"
                href={p.action.href}
                {...(p.action.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
              >
                {p.action.label}
                <Arrow />
              </a>
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}
