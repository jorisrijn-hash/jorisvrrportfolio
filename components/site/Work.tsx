"use client";

import { useEffect, useRef, useState } from "react";
import { FEATURED, WORK_INTRO } from "@/content/portfolio";

/**
 * SELECTED WORK — a fixed marker, and work that travels past it.
 *
 * "Selected work" is small and pinned at the centre of the screen for the
 * whole section; it never moves. What moves is the work: the first project
 * rises up the left of the composition, leaves, and the second rises up the
 * right — the same system, mirrored. The scroll makes the composition.
 *
 * Each project is an image first. Everything else about it — the name, the
 * facts, the way in — is already there, masked, and is uncovered by the
 * pointer rather than faded in. On a keyboard the same thing happens on
 * focus; on a touch screen, where there is no pointer to reveal anything,
 * it is simply uncovered.
 */
export function Work() {
  const [at, setAt] = useState(0);
  const root = useRef<HTMLElement>(null);

  // which project the marker is counting — one observer, no scroll handler
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const marks = [...el.querySelectorAll<HTMLElement>("[data-project]")];
    const io = new IntersectionObserver(
      () => {
        const mid = window.innerHeight / 2;
        let i = 0;
        marks.forEach((m, k) => {
          if (m.getBoundingClientRect().top <= mid) i = k;
        });
        setAt(i);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "-35% 0px -35% 0px" },
    );
    marks.forEach((m) => io.observe(m));
    return () => io.disconnect();
  }, []);

  return (
    <section className="work" id="work" ref={root}>
      {/* the anchor: pinned at the centre, never moving with the work */}
      <div className="work__marker" aria-hidden="true">
        <span className="m">{WORK_INTRO.marker}</span>
        <span className="m work__count">
          <span data-at={at === 0 || undefined}>01</span>
          <span className="work__slash">/</span>
          <span data-at={at === 1 || undefined}>02</span>
        </span>
      </div>

      {FEATURED.map((p, i) => (
        <article
          key={p.slug}
          className="work__project"
          data-project={i}
          data-side={i % 2 === 0 ? "left" : "right"}
        >
          <a
            className="work__view"
            href={p.action.href}
            {...(p.action.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
            aria-label={`${p.title.join(" ")} — ${p.action.label}`}
          >
            <span className="work__num m" aria-hidden="true">{p.number}</span>

            <figure className="work__figure">
              <img
                src={`${p.media.src}-1680.webp`}
                srcSet={`${p.media.src}-960.webp 960w, ${p.media.src}-1680.webp 1680w`}
                sizes="(max-width: 900px) 86vw, 52vw"
                alt={p.media.alt}
                width={1680}
                height={1074}
                loading="lazy"
                decoding="async"
              />

              {/* already there, masked: the pointer uncovers it */}
              <figcaption className="work__reveal">
                <span className="work__kind m">{p.kind} · {p.year}</span>
                <span className="work__title d">
                  {p.title.map((line) => <span key={line}>{line}</span>)}
                </span>
                <span className="work__meta">
                  {p.meta.map((m) => (
                    <span key={m.label} className="work__row">
                      <span className="m">{m.label}</span>
                      <span>{m.value}</span>
                    </span>
                  ))}
                </span>
                <span className="work__show">
                  <span className="work__showbox">Show work</span>
                  <span className="m">{p.action.label}</span>
                </span>
              </figcaption>
            </figure>
          </a>
        </article>
      ))}
    </section>
  );
}
