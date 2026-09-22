"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  FED_CELLS, PLANE, PROJECTS, WORK_ABOUT, WORK_CUES_FROM_ABOUT, WORK_CUES_IN, WORK_CUES_OUT,
  WORK_CUES_TO_ABOUT, WORK_IN, WORK_OUT, lockTime, mediaStill, mediaWidth, thumbSrc,
} from "@/content/work";
import { PANELS } from "@/content/about";
import { addTick } from "@/lib/ticker";
import { useSound } from "@/lib/sound";
import { computeLayout, type Layout } from "@/lib/layout";

let preloaded = false;

/** Warm the media before the surface forms — called on [WORK] hover/focus. */
export function preloadWork() {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  // The project Work opens on, and the index thumbnails it shows — not the
  // whole portfolio. (When switching exists: next, then previous, from here.)
  const L = computeLayout();
  const still = mediaStill(PROJECTS[0], mediaWidth(L.plane.w * L.fit));
  if (still) new Image().src = still;
  PROJECTS.forEach((p) => {
    const t = thumbSrc(p);
    if (t) new Image().src = t;
  });
}

const CELL_W = PLANE.w / PLANE.cols;
const CELL_H = PLANE.h / PLANE.rows;
const r2 = (n: number) => Math.round(n * 100) / 100;
const hash = (n: number) => {
  const x = Math.sin(n * 91.345 + 7.13) * 43758.5453;
  return x - Math.floor(x);
};

/** Which About panel a cell belongs to: rows 0-5 the statement, the lower
 *  half split between META (left) and LOG (right). */
function block(r: number, c: number) {
  const half = PLANE.rows / 2;
  const mid = PLANE.cols / 2;
  if (r < half) return { i: 0, r0: 0, c0: 0, rows: half, cols: PLANE.cols };
  if (c < mid) return { i: 1, r0: half, c0: 0, rows: half, cols: mid };
  return { i: 2, r0: half, c0: mid, rows: half, cols: mid };
}

/**
 * One cell per sculpture cube and beyond. Each carries:
 *   lock      when it appears on the way in, matching its cube's arrival
 *   out       when it folds away on the way home, just as its cube returns
 *   ax..asy   where it re-grids inside its About panel (desktop defaults;
 *             re-measured from the live panels whenever the move runs)
 *   sx..ry    its own scatter — the decompose beat between surface and panel
 *   ad/bd     its stagger toward About, and back
 */
const CELLS = Array.from({ length: PLANE.cols * PLANE.rows }, (_, k) => {
  const r = Math.floor(k / PLANE.cols);
  const c = k % PLANE.cols;
  const lock = lockTime(r, c);
  const b = block(r, c);
  const [px, py, pw, ph] = [PANELS.top, PANELS.meta, PANELS.body][b.i];
  const tw = pw / b.cols;
  const th = ph / b.rows;
  const ad = r2((r + c * 0.5) * 0.012);
  return {
    k, r, c,
    lock: r2(lock),
    out: r2(Math.max(0, (WORK_OUT.from - (lock + 0.08)) / WORK_OUT.rate)),
    fed: k < FED_CELLS,
    glitch: r === 3 || r === 8,
    ax: r2(px - WORK_ABOUT.flat.x + (c - b.c0) * tw - c * CELL_W),
    ay: r2(py - WORK_ABOUT.flat.y + (r - b.r0) * th - r * CELL_H),
    asx: r2((tw / CELL_W) * 1000) / 1000,
    asy: r2((th / CELL_H) * 1000) / 1000,
    sx: r2((hash(k) - 0.5) * 120),
    sy: r2((hash(k + 31) - 0.5) * 80),
    sz: r2(40 + hash(k + 67) * 180),
    rx: r2((hash(k + 101) - 0.5) * 60),
    ry: r2((hash(k + 149) - 0.5) * 60),
    ad,
    bd: r2(0.23 - ad),
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

/** Write the layout the CSS surface needs (desktop values are the CSS defaults). */
function applyLayout(el: HTMLElement, L: Layout) {
  // Lite screens take the simplified Work <-> About handover (experience.css).
  el.toggleAttribute("data-lite", L.lite);
  const s = el.style;
  s.setProperty("--fit", String(L.fit));
  s.setProperty("--stage-y", `${L.stageY * 100}%`);
  s.setProperty("--plane-x", `${r2(L.plane.x)}px`);
  s.setProperty("--plane-y", `${r2(L.plane.y)}px`);
  s.setProperty("--plane-yaw", `${L.plane.yaw}deg`);
  s.setProperty("--plane-w", `${r2(L.plane.w)}px`);
  s.setProperty("--plane-h", `${r2(L.plane.h)}px`);
  s.setProperty("--flat-x", `${r2(L.flat.x)}px`);
  s.setProperty("--flat-y", `${r2(L.flat.y)}px`);
  s.setProperty("--media-bottom", `${Math.round(L.mediaBottom)}px`);
}

/**
 * Re-grid every cell into its About panel, measured from the live panels.
 * On compact screens the panels scroll, so each rectangle is clipped to the
 * viewport; a panel entirely off-screen takes its cells down to the edge,
 * where they fade instead of travelling out of view.
 */
type CellTarget = { ax: number; ay: number; asx: number; asy: number; visible: boolean };

function mapToPanels(el: HTMLElement, L: Layout): CellTarget[] {
  const out: CellTarget[] = [];
  const panels = [...document.querySelectorAll<HTMLElement>(".about__panel")].slice(0, 3);
  if (panels.length < 3) return out;
  const cx = L.vw / 2;
  const cy = L.vh * L.stageY;
  const cw = L.plane.w / PLANE.cols;
  const ch = L.plane.h / PLANE.rows;
  const rects = panels.map((p) => {
    const r = p.getBoundingClientRect();
    const top = Math.max(r.top, 0);
    const bottom = Math.min(r.bottom, L.vh);
    const visible = bottom - top > 8;
    return {
      x: (r.left - cx) / L.fit - L.flat.x,
      y: ((visible ? top : Math.min(Math.max(r.top, 0), L.vh - 2)) - cy) / L.fit - L.flat.y,
      w: r.width / L.fit,
      h: Math.max(visible ? bottom - top : 2, 2) / L.fit,
      visible,
    };
  });
  el.querySelectorAll<HTMLElement>(".work-cell").forEach((cell, k) => {
    const r = Math.floor(k / PLANE.cols);
    const c = k % PLANE.cols;
    const b = block(r, c);
    const rect = rects[b.i];
    const tw = rect.w / b.cols;
    const th = rect.h / b.rows;
    const t: CellTarget = {
      ax: r2(rect.x + (c - b.c0) * tw - c * cw),
      ay: r2(rect.y + (r - b.r0) * th - r * ch),
      asx: r2((tw / cw) * 1000) / 1000,
      asy: r2((th / ch) * 1000) / 1000,
      visible: rect.visible,
    };
    out.push(t);
    cell.style.setProperty("--pv", t.visible ? "1" : "0");
  });
  return out;
}

const SEALED = "translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) scale(1.002, 1.002)";
const panelPose = (t: CellTarget) =>
  `translate3d(${t.ax}px, ${t.ay}px, 0px) rotateX(0deg) rotateY(0deg) scale(${t.asx}, ${t.asy})`;
const scatterPose = (t: CellTarget, c: (typeof CELLS)[number]) =>
  `translate3d(${r2(t.ax * 0.35 + c.sx)}px, ${r2(t.ay * 0.35 + c.sy)}px, ${c.sz}px) ` +
  `rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(0.84, 0.84)`;

/**
 * The decompose -> align move, driven by the Web Animations API.
 *
 * These were CSS keyframes reading per-cell custom properties, which cannot be
 * composited: 216 cells then re-resolved their transforms on the main thread
 * every frame (~3ms of style per frame, and dropped frames). Concrete numeric
 * keyframes hand the same motion to the compositor.
 */
function runCellMove(el: HTMLElement, targets: CellTarget[], dir: "to" | "from") {
  if (!targets.length) return;
  const cells = el.querySelectorAll<HTMLElement>(".work-cell");
  cells.forEach((cell, k) => {
    const t = targets[k];
    const c = CELLS[k];
    if (!t || !c) return;
    const panel = panelPose(t);
    const mid = scatterPose(t, c);
    const frames =
      dir === "to"
        ? [{ transform: SEALED }, { transform: mid, offset: 0.42 }, { transform: panel }]
        : [{ transform: panel }, { transform: mid, offset: 0.58 }, { transform: SEALED }];
    cell.animate(frames, {
      duration: dir === "to" ? 1150 : 1100,
      delay: (dir === "to" ? c.ad + 0.06 : c.bd) * 1000,
      easing: "cubic-bezier(0.42, 0, 0.3, 1)",
      fill: "forwards",
    });
  });
}

type Origin = "home" | "about";
type Target = "home" | "about";

/**
 * FEATURED WORK — the media surface, rebuilt natively from maintofeaturedwork.mp4.
 *
 * The surface is not faded in. It is a CSS-3D plane under the same camera as
 * the sculpture (1600px perspective, same centre, same fit), divided into the
 * same 18x12 cells the sculpture's cubes fly into. At each cell's lock time
 * the arriving cube hands over to that cell, which carries its slice of the
 * image: rows lock top to bottom as dark tiles over pale glass, turn
 * translucent, then seal into one plane — the moment the frame locks.
 *
 * The same cells carry every other move:
 *   -> home    the seal opens and cells fold away as their cubes return
 *   -> about   the plane turns to the camera; every cell lifts off toward the
 *              viewer with its own tilt (decompose), then gathers into its
 *              About panel's live rectangle (align), frosting as it travels,
 *              and dissolves tile by tile into the glass
 *   about ->   the reverse: panels become frosted cells in place, which lift,
 *              gather back into the surface, clear, and seal
 *
 * Geometry comes from lib/layout (desktop reference or compact), written to
 * CSS variables. One subscription to the shared frame clock raises stage
 * attributes at their moments; the motion itself is CSS keyed to them.
 */
export function WorkStage({
  from = "home",
  leaving,
  leavingTo = "home",
  still,
  onArrive,
}: {
  from?: Origin;
  leaving: boolean;
  leavingTo?: Target;
  still: boolean;
  onArrive: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const drv = useRef<HTMLParagraphElement>(null);
  const { cue } = useSound();

  // A single project for this checkpoint; switching will move this index.
  // (The first with media: a project without any cannot form the surface.)
  const [index] = useState(() => Math.max(0, PROJECTS.findIndex((p) => p.media)));
  const project = PROJECTS[index];
  // Chosen once for this screen; the cells and the <img> share it.
  const [mw] = useState(() => {
    const L = computeLayout();
    return mediaWidth(L.plane.w * L.fit);
  });
  const still_ = mediaStill(project, mw) ?? "";

  const [origin] = useState<Origin>(from);
  const targets = useRef<CellTarget[]>([]);
  const [stillAtMount] = useState(still);
  const leavingRef = useRef(leaving);
  const leavingToRef = useRef(leavingTo);
  const arrive = useRef(onArrive);
  useEffect(() => { leavingRef.current = leaving; }, [leaving]);
  useEffect(() => { leavingToRef.current = leavingTo; }, [leavingTo]);
  useEffect(() => { arrive.current = onArrive; }, [onArrive]);

  // Before the first paint: the surface's geometry, and — arriving from
  // About — cells already sitting exactly on the panels they replace.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const L = computeLayout();
    applyLayout(el, L);
    if (origin === "about") {
      // Arriving from About: the cells start as the panels they replace.
      targets.current = mapToPanels(el, L);
      el.querySelectorAll<HTMLElement>(".work-cell").forEach((cell, k) => {
        const t = targets.current[k];
        if (t) cell.style.transform = panelPose(t);
      });
    }
  }, [origin]);

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

    let layout = computeLayout();
    const measure = () => {
      layout = computeLayout();
      applyLayout(el, layout);
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

    /** Once settled, forget how the surface arrived, so every later move
     *  starts from the plain sealed state. */
    const settle = () => {
      set(el, "data-regroup", false);
      el.setAttribute("data-origin", "settled");
      // Hand the cells back to CSS, so the next move starts from the sealed state.
      el.querySelectorAll<HTMLElement>(".work-cell").forEach((cell) => {
        cell.getAnimations().forEach((a) => a.cancel());
        cell.style.transform = "";
      });
    };

    /** Step 1 of leaving: the single plane hands back to its sealed cells —
     *  identical pixels — so there is something to move on the next frame. */
    const unseat = (to: Target) => {
      ["data-solid", "data-ui", "data-echo", "data-link", "data-glitch"].forEach((n) => set(el, n, false));
      if (to === "about") targets.current = mapToPanels(el, layout);
    };
    /** Step 2: the move itself. */
    const depart = (to: Target) => {
      if (to === "about") {
        set(el, "data-drift", false);
        set(el, "data-to-about");
        runCellMove(el, targets.current, "to");
      } else {
        set(el, "data-leaving");
      }
    };

    // Reduced motion: settled states at once, no frame loop.
    if (stillAtMount) {
      ["data-form", "data-seal", "data-ui", "data-echo", "data-solid"].forEach((n) => set(el, n));
      settle();
      arrive.current();
      let left = false;
      const id = window.setInterval(() => {
        if (leavingRef.current && !left) {
          left = true;
          const to = leavingToRef.current;
          unseat(to);
          depart(to);
          set(stage, "data-x-work", false);
          if (to === "about") set(el, "data-dissolve");
          else arrive.current();
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
    let departed = false;
    let leftArrived = false;
    let cueIn = 0;
    let cueOut = 0;
    const cuesIn = origin === "about" ? WORK_CUES_FROM_ABOUT : WORK_CUES_IN;
    const end = origin === "about" ? WORK_ABOUT.end : WORK_IN.end;

    const frame = (now: number) => {
      // ---- leaving ------------------------------------------------------------
      if (leavingRef.current && leftAt === null) {
        leftAt = now;
        unseat(leavingToRef.current);
        return;
      }
      if (leftAt !== null) {
        const to = leavingToRef.current;
        if (!departed) {
          departed = true;
          depart(to);
        }
        const u = (now - leftAt) / 1000;
        const cues = to === "about" ? WORK_CUES_TO_ABOUT : WORK_CUES_OUT;
        while (cueOut < cues.length && u >= cues[cueOut].at) {
          if (u - cues[cueOut].at < 0.25) cue(cues[cueOut].cue);
          cueOut++;
        }
        if (to === "about") {
          // About reports arrival; Work only hands its cells to the glass.
          if (u >= WORK_ABOUT.dissolve) {
            set(el, "data-dissolve");
            set(stage, "data-x-work", false);
          }
        } else {
          if (u >= WORK_OUT.hud) set(stage, "data-x-work", false);
          if (!leftArrived && u >= WORK_OUT.end) {
            leftArrived = true;
            arrive.current();
          }
        }
        return;
      }

      // ---- arriving -----------------------------------------------------------
      if (arrived) return;
      const t = (now - start) / 1000;

      if (origin === "about") {
        // Raised on the first frame, after the panel-shaped cells have painted.
        if (!on.has("w:data-regroup")) {
          set(el, "data-regroup");
          runCellMove(el, targets.current, "from");
        }
        if (t >= WORK_ABOUT.seal) set(el, "data-seal");
        if (t >= WORK_ABOUT.ui) set(el, "data-ui");
        if (t >= WORK_ABOUT.echo) set(el, "data-echo");
        if (t >= WORK_ABOUT.solid) {
          set(el, "data-solid");
          set(el, "data-drift");
        }
      } else {
        // Raised on the first frame, after the initial styles have painted, so
        // every cell transition runs from its start.
        set(el, "data-form");
        if (t >= WORK_IN.wire[0]) set(el, "data-wire");
        if (t >= WORK_IN.link) set(el, "data-link");
        set(el, "data-glitch", t >= WORK_IN.glitch && t < WORK_IN.glitch + 0.09);
        if (t >= WORK_IN.seal) set(el, "data-seal");
        if (t >= WORK_IN.ui) set(el, "data-ui");
        if (t >= WORK_IN.echo) set(el, "data-echo");
        if (t >= WORK_IN.solid) {
          set(el, "data-solid");
          set(el, "data-drift");
        }
      }

      while (cueIn < cuesIn.length && t >= cuesIn[cueIn].at) {
        if (t - cuesIn[cueIn].at < 0.25) cue(cuesIn[cueIn].cue);
        cueIn++;
      }
      if (t >= end) {
        arrived = true;
        settle();
        arrive.current();
      }
    };

    const stop = addTick(frame);
    return () => {
      stop();
      cleanup();
    };
  }, [cue, stillAtMount, origin]);

  const total = String(PROJECTS.length).padStart(2, "0");

  return (
    <div ref={root} className="work" data-origin={origin} style={{ ["--media" as string]: `url(${still_})` }}>
      <div className="work-3d">
        <div className="work-origin">
          <div className="work-plane">
            <svg
              className="work-wire"
              viewBox={`-120 -90 ${PLANE.w + 240} ${PLANE.h + 180}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d={WIRE} fill="none" stroke="#7d7d7d" strokeWidth="0.7" strokeOpacity="0.45" vectorEffect="non-scaling-stroke" />
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
                    ["--ax" as string]: `${cell.ax}px`,
                    ["--ay" as string]: `${cell.ay}px`,
                    ["--asx" as string]: cell.asx,
                    ["--asy" as string]: cell.asy,
                    ["--sx" as string]: `${cell.sx}px`,
                    ["--sy" as string]: `${cell.sy}px`,
                    ["--sz" as string]: `${cell.sz}px`,
                    ["--rx" as string]: `${cell.rx}deg`,
                    ["--ry" as string]: `${cell.ry}deg`,
                    ["--ad" as string]: `${cell.ad}s`,
                    ["--bd" as string]: `${cell.bd}s`,
                  }}
                />
              ))}
            </div>

            <figure className="work-media" data-cursor="view">
              {project.media?.kind === "video" ? (
                <video
                  src={project.media!.src}
                  poster={project.media!.poster}
                  preload="metadata"
                  muted
                  loop
                  playsInline
                  autoPlay
                  aria-label={project.media!.alt}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={still_}
                  decoding="async"
                  width={project.media?.width}
                  height={project.media?.height}
                  alt={project.media?.alt ?? ""}
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
          {/* A row exists only when there is something true to put in it. */}
          <div><dt>Discipline</dt><dd>{project.discipline}</dd></div>
          {project.year ? <div><dt>Year</dt><dd>{project.year}</dd></div> : null}
          {project.status ? <div><dt>Status</dt><dd>{project.status}</dd></div> : null}
        </dl>
        <p className="work-info__indexlabel" style={{ ["--d" as string]: "200ms" }}>
          Index · {project.id} / {total}
        </p>
        <ul className="work-info__thumbs" style={{ ["--d" as string]: "240ms" }} aria-label="Projects">
          {PROJECTS.map((p, i) => (
            <li key={p.id} data-current={i === index || undefined} aria-current={i === index || undefined}>
              {thumbSrc(p) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbSrc(p)} alt="" decoding="async" width={320} height={205} draggable={false} />
              ) : null}
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
