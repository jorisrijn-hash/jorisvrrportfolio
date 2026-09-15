"use client";

import { useEffect, useRef, useState } from "react";
import {
  FED_CELLS, PLANE, PROJECTS, WORK_CUES_IN, WORK_CUES_OUT, WORK_IN, WORK_OUT, lockTime, mediaStill,
} from "@/content/work";
import { addTick } from "@/lib/ticker";
import { useSound } from "@/lib/sound";

let preloaded = false;

/** Warm the media before the surface forms — called on [WORK] hover/focus. */
export function preloadWork() {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  PROJECTS.forEach((p) => {
    new Image().src = mediaStill(p);
    new Image().src = p.thumb;
  });
}

const CELL_W = PLANE.w / PLANE.cols;
const CELL_H = PLANE.h / PLANE.rows;
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * One cell per sculpture cube and beyond. Each carries its lock time (when it
 * appears, matching its cube's arrival) and its fold-out time on the way back.
 */
const CELLS = Array.from({ length: PLANE.cols * PLANE.rows }, (_, k) => {
  const r = Math.floor(k / PLANE.cols);
  const c = k % PLANE.cols;
  const lock = lockTime(r, c);
  return {
    k, r, c,
    lock: r2(lock),
    out: r2(Math.max(0, (WORK_OUT.from - (lock + 0.08)) / WORK_OUT.rate)),
    fed: k < FED_CELLS,
    glitch: r === 3 || r === 8,
  };
});

/** Triangulated wireframe the cells assemble over, plus a few construction lines. */
const WIRE = (() => {
  let d = "";
  for (let c = 0; c <= PLANE.cols; c++) d += `M${r2(c * CELL_W)} 0V${PLANE.h}`;
  for (let r = 0; r <= PLANE.rows; r++) d += `M0 ${r2(r * CELL_H)}H${PLANE.w}`;
  for (let r = 0; r < PLANE.rows; r++) {
    for (let c = 0; c < PLANE.cols; c++) {
      d += `M${r2(c * CELL_W)} ${r2((r + 1) * CELL_H)}L${r2((c + 1) * CELL_W)} ${r2(r * CELL_H)}`;
    }
  }
  const { w, h } = PLANE;
  d += `M-120 ${r2(h * 0.18)}L${w + 120} ${r2(h * 0.26)}`;
  d += `M${r2(w * 0.32)} -90L${r2(w * 0.37)} ${h + 90}`;
  d += `M-100 ${h + 40}L${w + 90} -70`;
  return d;
})();

const IN_FLAGS = ["data-form", "data-wire", "data-link", "data-glitch", "data-seal", "data-ui", "data-echo", "data-solid"];

/**
 * FEATURED WORK — the media surface, rebuilt natively from maintofeaturedwork.mp4.
 *
 * The surface is not faded in. It is a CSS-3D plane under the same camera as
 * the sculpture (1600px perspective, same centre, same fit), divided into the
 * same 18x12 cells the sculpture's cubes fly into. At each cell's lock time
 * the arriving cube hands over to that cell, which carries its slice of the
 * image: rows lock top to bottom as dark tiles, turn translucent, then seal
 * into one plane — the moment the frame locks.
 *
 * One subscription to the shared frame clock raises stage attributes at their
 * moments; every visual change after that is a CSS transition keyed to them,
 * so nothing here renders per frame.
 *
 *   leaving = false   home -> work, then holds
 *   leaving = true    work -> home: the surface folds away as the cubes return
 *
 * Project switching (later) is the same two halves on one surface: open the
 * seal and fold the cells, swap the project, form again.
 */
export function WorkStage({
  leaving,
  still,
  onArrive,
}: {
  leaving: boolean;
  still: boolean;
  onArrive: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const drv = useRef<HTMLParagraphElement>(null);
  const { cue } = useSound();

  // A single project for this checkpoint; switching will move this index.
  const [index] = useState(0);
  const project = PROJECTS[index];
  const still_ = mediaStill(project);

  const leavingRef = useRef(leaving);
  const arrive = useRef(onArrive);
  useEffect(() => { leavingRef.current = leaving; }, [leaving]);
  useEffect(() => { arrive.current = onArrive; }, [onArrive]);
  const [stillAtMount] = useState(still);

  useEffect(() => {
    const el = root.current;
    const stage = el?.closest<HTMLElement>(".experience");
    if (!el || !stage) return;

    const on = new Set<string>();
    const set = (target: HTMLElement, name: string, value = true) => {
      const key = `${target === stage ? "s" : "w"}:${name}`;
      if (value === on.has(key)) return;
      if (value) {
        on.add(key);
        target.setAttribute(name, "");
      } else {
        on.delete(key);
        target.removeAttribute(name);
      }
    };
    set(stage, "data-x-work");

    const measure = () => {
      const fit = Math.min(1.25, Math.max(0.5, Math.min(window.innerWidth / 1920, window.innerHeight / 950)));
      el.style.setProperty("--fit", String(fit));
      if (drv.current) drv.current.textContent = `Drv:// Viewport map ${window.innerWidth}x${window.innerHeight}`;
    };
    measure();
    window.addEventListener("resize", measure);

    const cleanup = () => {
      window.removeEventListener("resize", measure);
      on.forEach((key) => {
        const [who, name] = key.split(":");
        (who === "s" ? stage : el).removeAttribute(name);
      });
    };

    const beginLeaving = () => {
      ["data-solid", "data-ui", "data-echo", "data-link", "data-glitch"].forEach((n) => set(el, n, false));
      set(el, "data-leaving");
    };

    // Reduced motion: the settled surface at once, no frame loop.
    if (stillAtMount) {
      ["data-form", "data-seal", "data-ui", "data-echo", "data-solid"].forEach((n) => set(el, n));
      arrive.current();
      let left = false;
      const id = window.setInterval(() => {
        if (leavingRef.current && !left) {
          left = true;
          beginLeaving();
          set(stage, "data-x-work", false);
          arrive.current();
        }
      }, 50);
      return () => {
        window.clearInterval(id);
        cleanup();
      };
    }

    const start = performance.now();
    let arrived = false;
    let leftAt: number | null = null;
    let leftArrived = false;
    let cueIn = 0;
    let cueOut = 0;

    const frame = (now: number) => {
      if (leavingRef.current && leftAt === null) {
        leftAt = now;
        beginLeaving();
      }

      if (leftAt === null) {
        if (arrived) return;
        const t = (now - start) / 1000;
        // Raised on the first frame, after the initial styles have painted, so
        // every cell transition runs from its edge-on start.
        set(el, "data-form");
        if (t >= WORK_IN.wire[0]) set(el, "data-wire");
        if (t >= WORK_IN.link) set(el, "data-link");
        set(el, "data-glitch", t >= WORK_IN.glitch && t < WORK_IN.glitch + 0.09);
        if (t >= WORK_IN.seal) set(el, "data-seal");
        if (t >= WORK_IN.ui) set(el, "data-ui");
        if (t >= WORK_IN.echo) set(el, "data-echo");
        if (t >= WORK_IN.solid) set(el, "data-solid");
        while (cueIn < WORK_CUES_IN.length && t >= WORK_CUES_IN[cueIn].at) {
          if (t - WORK_CUES_IN[cueIn].at < 0.25) cue(WORK_CUES_IN[cueIn].cue);
          cueIn++;
        }
        if (t >= WORK_IN.end) {
          arrived = true;
          arrive.current();
        }
        return;
      }

      const u = (now - leftAt) / 1000;
      while (cueOut < WORK_CUES_OUT.length && u >= WORK_CUES_OUT[cueOut].at) {
        if (u - WORK_CUES_OUT[cueOut].at < 0.25) cue(WORK_CUES_OUT[cueOut].cue);
        cueOut++;
      }
      if (u >= WORK_OUT.hud) set(stage, "data-x-work", false);
      if (!leftArrived && u >= WORK_OUT.end) {
        leftArrived = true;
        arrive.current();
      }
    };

    const stop = addTick(frame);
    return () => {
      stop();
      cleanup();
    };
  }, [cue, stillAtMount]);

  const total = String(PROJECTS.length).padStart(2, "0");

  return (
    <div ref={root} className="work" style={{ ["--media" as string]: `url(${still_})` }}>
      <div className="work-3d">
        <div className="work-origin">
          <div className="work-plane">
            <svg className="work-wire" viewBox={`-120 -90 ${PLANE.w + 240} ${PLANE.h + 180}`} aria-hidden="true">
              <path d={WIRE} fill="none" stroke="#7d7d7d" strokeWidth="0.7" strokeOpacity="0.45" />
            </svg>

            <div className="work-ghost" aria-hidden="true" />

            <div className="work-cells" aria-hidden="true">
              {CELLS.map((cell) => (
                <i
                  key={cell.k}
                  className="work-cell"
                  data-fed={cell.fed || undefined}
                  data-g={cell.glitch || undefined}
                  style={{
                    ["--c" as string]: cell.c,
                    ["--r" as string]: cell.r,
                    ["--d" as string]: `${cell.lock}s`,
                    ["--o" as string]: `${cell.out}s`,
                  }}
                />
              ))}
            </div>

            <figure className="work-media" data-cursor="view">
              {project.media.type === "video" ? (
                <video
                  src={project.media.src}
                  poster={project.media.poster}
                  muted
                  loop
                  playsInline
                  autoPlay
                  aria-label={project.media.alt}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.media.src}
                  width={project.media.width}
                  height={project.media.height}
                  alt={project.media.alt}
                  draggable={false}
                />
              )}
            </figure>
          </div>

          <div className="work-echo" data-e="a" aria-hidden="true"><i /></div>
          <div className="work-echo" data-e="b" aria-hidden="true"><i /></div>
        </div>
      </div>

      <div className="work-labels" aria-hidden="true">
        <p className="work-label" data-l="link">Link:// Viewport re-map OK</p>
        <p ref={drv} className="work-label" data-l="drv">Drv:// Viewport map</p>
      </div>

      <section className="work-info" aria-labelledby="work-title">
        <p className="work-info__eyebrow" style={{ ["--d" as string]: "0ms" }}>Neural Node · Work</p>
        <h1 id="work-title" className="work-info__heading" style={{ ["--d" as string]: "60ms" }}>
          <span className="work-info__index">{project.id}</span>
          <span className="work-info__slash" aria-hidden="true">/</span>
          <span className="work-info__title">{project.title}</span>
        </h1>
        <dl className="work-info__meta" style={{ ["--d" as string]: "140ms" }}>
          <div><dt>Discipline</dt><dd>{project.discipline}</dd></div>
          <div><dt>Year</dt><dd>{project.year}</dd></div>
          <div><dt>Status</dt><dd>{project.status}</dd></div>
        </dl>
        <p className="work-info__indexlabel" style={{ ["--d" as string]: "200ms" }}>
          Index · {project.id} / {total}
        </p>
        <ul className="work-info__thumbs" style={{ ["--d" as string]: "240ms" }} aria-label="Projects">
          {PROJECTS.map((p, i) => (
            <li key={p.id} data-current={i === index || undefined} aria-current={i === index || undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumb} alt="" width={320} height={205} draggable={false} />
            </li>
          ))}
        </ul>
      </section>

      <footer className="work-foot">
        <div className="work-foot__row" style={{ ["--d" as string]: "260ms" }}>
          <span className="work-foot__label">Work</span>
          <span className="work-foot__count">{project.id} / {total}</span>
        </div>
        <div className="work-foot__segments" style={{ ["--d" as string]: "300ms", ["--n" as string]: PROJECTS.length }} aria-hidden="true">
          {PROJECTS.map((p, i) => (
            <i key={p.id} data-current={i === index || undefined} />
          ))}
        </div>
        <div className="work-foot__row" style={{ ["--d" as string]: "340ms" }}>
          <span className="work-foot__name">{project.title}</span>
          {/* Inert until project switching is built. */}
          <span className="work-foot__ctl">
            <button type="button" className="work-ctl" aria-label="Previous project" aria-disabled="true" data-cursor="prev">‹</button>
            <button type="button" className="work-ctl" aria-label="Next project" aria-disabled="true" data-cursor="next">›</button>
          </span>
        </div>
      </footer>
    </div>
  );
}
