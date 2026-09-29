"use client";

import { useEffect, useRef, useState } from "react";
import { FEATURED, WORK_INTRO } from "@/content/portfolio";

/**
 * SELECTED WORK.
 *
 * The marker stays pinned at the centre of the screen; the work travels past
 * it, the first project up the left of the composition and the second up the
 * right. Each one is a label, an image, and a line about it on the side the
 * image is not.
 *
 * THE IMAGE IS THE INTERACTIVE SURFACE, and it is the only one. Entering it
 * activates the project: the detail comes up and the lens appears. Leaving
 * it puts both back. The state is held here rather than in CSS :hover, so
 * nested elements cannot fight over it and nothing can be left switched on.
 */
export function Work() {
  const [at, setAt] = useState(0);
  const [on, setOn] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);

  // which project the marker is counting
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

  /* ---- the lens: eased after the pointer, never snapped to it ----------- */
  const lens = useRef<{ el: HTMLElement; x: number; y: number; tx: number; ty: number }[]>([]);
  const frame = useRef(0);
  const ease = () => {
    frame.current = 0;
    let moving = false;
    lens.current.forEach((l) => {
      if (!l) return;
      l.x += (l.tx - l.x) * 0.16;
      l.y += (l.ty - l.y) * 0.16;
      if (Math.abs(l.tx - l.x) > 0.3 || Math.abs(l.ty - l.y) > 0.3) moving = true;
      l.el.style.setProperty("--lx", `${l.x.toFixed(1)}px`);
      l.el.style.setProperty("--ly", `${l.y.toFixed(1)}px`);
    });
    if (moving) frame.current = requestAnimationFrame(ease);
  };

  const track = (e: React.PointerEvent<HTMLElement>, i: number) => {
    if (e.pointerType !== "mouse") return;
    const figure = e.currentTarget;
    const box = figure.querySelector<HTMLElement>(".work__lens");
    if (!box) return;
    const r = figure.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const cur = lens.current[i] ?? { el: box, x, y, tx: x, ty: y };
    cur.el = box;
    cur.tx = x;
    cur.ty = y;
    lens.current[i] = cur;
    box.style.setProperty("--fw", `${Math.round(r.width)}px`);
    if (!frame.current) frame.current = requestAnimationFrame(ease);
  };

  const enter = (e: React.PointerEvent<HTMLElement>, i: number) => {
    if (e.pointerType !== "mouse") return;
    // the lens starts where the pointer came in, so it does not fly across
    const box = e.currentTarget.querySelector<HTMLElement>(".work__lens");
    const r = e.currentTarget.getBoundingClientRect();
    if (box) {
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      lens.current[i] = { el: box, x, y, tx: x, ty: y };
      box.style.setProperty("--lx", `${x}px`);
      box.style.setProperty("--ly", `${y}px`);
      box.style.setProperty("--fw", `${Math.round(r.width)}px`);
    }
    setOn(i);
  };

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); }, []);

  return (
    <section className="work" id="work" ref={root} aria-labelledby="work-title">
      <h2 className="sr-only" id="work-title">{WORK_INTRO.marker}</h2>
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
          data-on={on === i || undefined}
        >
          <div className="work__zone">
            {/* the label, above the image, where a project is named */}
            <h3 className="work__label" data-reveal>
              <span className="work__num m">{p.number}</span>
              <span className="d">{p.title.join(" ")}</span>
            </h3>

            <a
              className="work__view"
              href={p.action.href}
              {...(p.action.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
              aria-label={`${p.title.join(" ")}, ${p.kind}. ${p.action.label}`}
              onPointerEnter={(e) => enter(e, i)}
              onPointerMove={(e) => track(e, i)}
              onPointerLeave={() => setOn(null)}
              onFocus={() => setOn(i)}
              onBlur={() => setOn(null)}
              data-track
            >
              <figure className="work__figure">
                <img
                  src={`${p.media.src}-1680.webp`}
                  srcSet={`${p.media.src}-960.webp 960w, ${p.media.src}-1680.webp 1680w`}
                  sizes="(max-width: 900px) 100vw, 42vw"
                  alt={p.media.alt}
                  width={1680}
                  height={1074}
                  loading="lazy"
                  decoding="async"
                />
                {/* the lens: the same photograph, inverted, clipped to a box */}
                <span className="work__lens" aria-hidden="true">
                  <img
                    src={`${p.media.src}-1680.webp`}
                    srcSet={`${p.media.src}-960.webp 960w, ${p.media.src}-1680.webp 1680w`}
                    sizes="(max-width: 900px) 100vw, 42vw"
                    alt=""
                    width={1680}
                    height={1074}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="work__lens-label">Read more</span>
                </span>
              </figure>
            </a>
          </div>

          {/* the line about it, on the side the image is not */}
          <div className="work__said">
            <p className="work__kind m" data-reveal>{p.kind} · {p.year}</p>
            <p className="work__summary" data-reveal>{p.summary}</p>
            <dl className="work__meta">
              {p.meta.map((m) => (
                <div key={m.label}>
                  <dt className="m">{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>
      ))}
    </section>
  );
}
