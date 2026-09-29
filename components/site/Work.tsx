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

  /**
   * The lens follows the pointer with weight rather than snapping to it: the
   * target is written on a pointermove, and one frame eases the lens toward
   * it — the same easing the rest of the site moves with.
   */
  const lensRef = useRef<{ el: HTMLElement; x: number; y: number; tx: number; ty: number }[]>([]);
  const frame = useRef(0);
  const ease = () => {
    frame.current = 0;
    let moving = false;
    lensRef.current.forEach((l) => {
      if (!l) return;
      l.x += (l.tx - l.x) * 0.16;
      l.y += (l.ty - l.y) * 0.16;
      if (Math.abs(l.tx - l.x) > 0.3 || Math.abs(l.ty - l.y) > 0.3) moving = true;
      l.el.style.setProperty("--lx", `${l.x.toFixed(1)}px`);
      l.el.style.setProperty("--ly", `${l.y.toFixed(1)}px`);
    });
    if (moving) frame.current = requestAnimationFrame(ease);
  };
  const lens = (e: React.PointerEvent, i: number) => {
    if (e.pointerType !== "mouse") return;
    const fig = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(".work__lens");
    if (!fig) return;
    const r = (fig.parentElement as HTMLElement).getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const cur = lensRef.current[i] ?? { el: fig, x, y, tx: x, ty: y };
    cur.el = fig;
    cur.tx = x;
    cur.ty = y;
    lensRef.current[i] = cur;
    // the inverted copy is laid out against the figure's own width
    fig.style.setProperty("--fw", `${Math.round(r.width)}px`);
    if (!frame.current) frame.current = requestAnimationFrame(ease);
  };
  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); }, []);

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
            onPointerMove={(e) => lens(e, i)}
          >
            <span className="work__num m" aria-hidden="true">{p.number}</span>

            <figure className="work__figure">
              <img
                src={`${p.media.src}-1680.webp`}
                srcSet={`${p.media.src}-960.webp 960w, ${p.media.src}-1680.webp 1680w`}
                sizes="(max-width: 900px) 100vw, 48vw"
                alt={p.media.alt}
                width={1680}
                height={1074}
                loading="lazy"
                decoding="async"
              />
              {/* The lens. It holds a second copy of the same photograph,
                  inverted, aligned to the pixel with the one behind it and
                  clipped to this rectangle — so the image really does turn
                  into its own negative inside the box, rather than being
                  covered by one. */}
              <span className="work__lens" aria-hidden="true">
                <img
                  src={`${p.media.src}-1680.webp`}
                  srcSet={`${p.media.src}-960.webp 960w, ${p.media.src}-1680.webp 1680w`}
                  sizes="(max-width: 900px) 100vw, 48vw"
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

          {/* beside the image, not under it and not on it */}
          <div className="work__beside">
            <span className="work__kind m">{p.kind} · {p.year}</span>
            <h3 className="work__title d">
              {p.title.map((line) => <span key={line}>{line}</span>)}
            </h3>
            <p className="work__summary">{p.summary}</p>
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
