"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  FED_CELLS, PLANE, PROJECTS, WORK_ABOUT, WORK_CUES_FROM_ABOUT, WORK_CUES_IN, WORK_CUES_OUT,
  WORK_CUES_TO_ABOUT, WORK_IN, WORK_OUT, WORK_SWAP, lockTime, mediaStill, mediaWidth,
} from "@/content/work";
import { ArrowUpRight } from "lucide-react";
import { PANELS } from "@/content/about";
import { SPOTLIGHT } from "@/content/spotlight";
import { addTick } from "@/lib/ticker";
import { useSound } from "@/lib/sound";
import { triggerVhs } from "@/lib/vhs";
import { caseSurface, computeLayout, type Layout } from "@/lib/layout";

let preloaded = false;

/** Warm the media before the surface forms — called on [WORK] hover/focus. */
export function preloadWork() {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  // Only the project Work opens on. The others are asked for when the
  // visitor switches to them (WorkStage.switchTo), so arriving at Work never
  // downloads a portfolio's worth of images it may not show.
  const L = computeLayout();
  const still = mediaStill(PROJECTS[Math.max(0, PROJECTS.findIndex((p) => p.media))], mediaWidth(L.plane.w * L.fit));
  if (still) new Image().src = still;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const hash = (n: number) => {
  const x = Math.sin(n * 91.345 + 7.13) * 43758.5453;
  return x - Math.floor(x);
};

/** Which About panel a cell belongs to: rows 0-5 the statement, the lower
 *  half split between META (left) and LOG (right). */
function block(r: number, c: number, cols: number, rows: number) {
  const half = rows / 2;
  const mid = cols / 2;
  if (r < half) return { i: 0, r0: 0, c0: 0, rows: half, cols };
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
/**
 * The cells, for a given grid. Desktop keeps the measured 18x12; a phone
 * forms the same surface from 9x6 (lib/layout PlaneSpec) — a quarter of the
 * elements. Measured on a 4x-throttled phone, the cells were the entire cost
 * of the formation: 607ms of style recalc against 189ms with them hidden.
 */
function buildCells(cols: number, rows: number) {
  const cellW = PLANE.w / cols;
  const cellH = PLANE.h / rows;
  const fed = Math.round(FED_CELLS * ((cols * rows) / (PLANE.cols * PLANE.rows)));
  return Array.from({ length: cols * rows }, (_, k) => {
    const r = Math.floor(k / cols);
    const c = k % cols;
    const lock = lockTime(r, c, cols, rows);
    const b = block(r, c, cols, rows);
    const [px, py, pw, ph] = [PANELS.top, PANELS.meta, PANELS.body][b.i];
    const tw = pw / b.cols;
    const th = ph / b.rows;
    const ad = r2((r + c * 0.5) * 0.012 * (PLANE.rows / rows));
    return {
      k, r, c,
      lock: r2(lock),
      out: r2(Math.max(0, (WORK_OUT.from - (lock + 0.08)) / WORK_OUT.rate)),
      fed: k < fed,
      glitch: r === Math.floor(rows / 4) || r === Math.floor((rows * 2) / 3),
      ax: r2(px - WORK_ABOUT.flat.x + (c - b.c0) * tw - c * cellW),
      ay: r2(py - WORK_ABOUT.flat.y + (r - b.r0) * th - r * cellH),
      asx: r2((tw / cellW) * 1000) / 1000,
      asy: r2((th / cellH) * 1000) / 1000,
      sx: r2((hash(k) - 0.5) * 120),
      sy: r2((hash(k + 31) - 0.5) * 80),
      sz: r2(40 + hash(k + 67) * 180),
      rx: r2((hash(k + 101) - 0.5) * 60),
      ry: r2((hash(k + 149) - 0.5) * 60),
      ad,
      bd: r2(0.23 - ad),
    };
  });
}
type Cell = ReturnType<typeof buildCells>[number];

/** Triangulated wireframe the cells assemble over, plus a few construction lines. */
function buildWire(cols: number, rows: number) {
  const cellW = PLANE.w / cols;
  const cellH = PLANE.h / rows;
  let d = "";
  for (let c = 0; c <= cols; c++) d += `M${r2(c * cellW)} 0V${PLANE.h}`;
  for (let r = 0; r <= rows; r++) d += `M0 ${r2(r * cellH)}H${PLANE.w}`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      d += `M${r2(c * cellW)} ${r2((r + 1) * cellH)}L${r2((c + 1) * cellW)} ${r2(r * cellH)}`;
    }
  }
  const { w, h } = PLANE;
  d += `M-120 ${r2(h * 0.18)}L${w + 120} ${r2(h * 0.26)}`;
  d += `M${r2(w * 0.32)} -90L${r2(w * 0.37)} ${h + 90}`;
  d += `M-100 ${h + 40}L${w + 90} -70`;
  return d;
}

/** Write the layout the CSS surface needs (desktop values are the CSS defaults). */
function applyLayout(el: HTMLElement, L: Layout, spotlight = false) {
  // Lite screens take the simplified Work <-> About handover (experience.css).
  el.toggleAttribute("data-lite", L.lite);
  const s = el.style;
  // The spotlight is this surface scaled about the stage centre and set
  // aside; the sculpture's cubes fly to exactly the same rectangle
  // (lib/layout SpotlightSpec). Going on to Work animates it back to 1.
  s.setProperty("--sp-scale", spotlight ? String(L.spotlight.scale) : "1");
  s.setProperty("--sp-x", `${spotlight ? r2(L.spotlight.dx) : 0}px`);
  s.setProperty("--sp-y", `${spotlight ? r2(L.spotlight.dy) : 0}px`);
  s.setProperty("--fit", String(L.fit));
  s.setProperty("--stage-y", `${L.stageY * 100}%`);
  s.setProperty("--plane-x", `${r2(L.plane.x)}px`);
  s.setProperty("--plane-y", `${r2(L.plane.y)}px`);
  s.setProperty("--plane-yaw", `${L.plane.yaw}deg`);
  s.setProperty("--cols", String(L.plane.cols));
  s.setProperty("--rows", String(L.plane.rows));
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
  const { cols, rows } = L.plane;
  const out: CellTarget[] = [];
  const panels = [...document.querySelectorAll<HTMLElement>(".about__panel")].slice(0, 3);
  if (panels.length < 3) return out;
  const cx = L.vw / 2;
  const cy = L.vh * L.stageY;
  const cw = L.plane.w / cols;
  const ch = L.plane.h / rows;
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
    const r = Math.floor(k / cols);
    const c = k % cols;
    const b = block(r, c, cols, rows);
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

/** How long the spotlight's surface takes to become the Work plane (matches
 *  the CSS transition on .work-origin). */
const HANDOVER = 900;

const SEALED = "translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) scale(1.002, 1.002)";
const panelPose = (t: CellTarget) =>
  `translate3d(${t.ax}px, ${t.ay}px, 0px) rotateX(0deg) rotateY(0deg) scale(${t.asx}, ${t.asy})`;
const scatterPose = (t: CellTarget, c: Cell) =>
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
function runCellMove(el: HTMLElement, targets: CellTarget[], dir: "to" | "from", grid: Cell[]) {
  if (!targets.length) return;
  const cells = el.querySelectorAll<HTMLElement>(".work-cell");
  cells.forEach((cell, k) => {
    const t = targets[k];
    const c = grid[k];
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
  variant = "work",
  toWork = false,
  toCase = false,
  onOpenCase,
}: {
  from?: Origin;
  leaving: boolean;
  leavingTo?: Target;
  still: boolean;
  onArrive: () => void;
  /** "spotlight": the same surface, smaller and set aside, formed faster */
  variant?: "work" | "spotlight";
  /** the spotlight carrying its surface on into the full Work environment */
  toWork?: boolean;
  /** the surface is on its way to becoming a case-study hero */
  toCase?: boolean;
  /** open this project's case study from inside the environment */
  onOpenCase?: (slug: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const drv = useRef<HTMLParagraphElement>(null);
  const { cue } = useSound();

  // The project on the surface. The environment is never rebuilt to change
  // it: the same cells re-form around a different image (see switchTo).
  // (Opens on the first with media: a project without any cannot form.)
  const [index, setIndex] = useState(() => Math.max(0, PROJECTS.findIndex((p) => p.media)));
  const [switching, setSwitching] = useState(false);
  const project = PROJECTS[index];
  // Chosen once for this screen; the cells and the <img> share it.
  const [mw] = useState(() => {
    const L = computeLayout();
    return mediaWidth(L.plane.w * L.fit);
  });
  const still_ = mediaStill(project, mw) ?? "";

  const [origin] = useState<Origin>(from);
  const [bornAs] = useState(variant);
  // The grid this screen forms the surface from (desktop 18x12, phone 9x6).
  const [cells] = useState(() => {
    const { cols, rows } = computeLayout().plane;
    return buildCells(cols, rows);
  });
  const [wire] = useState(() => {
    const { cols, rows } = computeLayout().plane;
    return buildWire(cols, rows);
  });
  // The formation's own attribute bookkeeping, lent to the switch so the two
  // can never contradict each other (filled by the clock effect below).
  const swap = useRef<{ out: () => void; in: () => void; done: () => void } | null>(null);
  const ready = useRef(false);        // the surface has finished forming
  const busy = useRef(false);         // a switch is running: refuse another
  const at = useRef(index);           // the live index, for the callbacks
  const timers = useRef<number[]>([]);
  const toWorkRef = useRef(toWork);
  useEffect(() => { toWorkRef.current = toWork; }, [toWork]);
  const toCaseRef = useRef(toCase);
  useEffect(() => { toCaseRef.current = toCase; }, [toCase]);
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
    applyLayout(el, L, bornAs === "spotlight");
    if (origin === "about") {
      // Arriving from About: the cells start as the panels they replace.
      targets.current = mapToPanels(el, L);
      el.querySelectorAll<HTMLElement>(".work-cell").forEach((cell, k) => {
        const t = targets.current[k];
        if (t) cell.style.transform = panelPose(t);
      });
    }
  }, [origin, bornAs, cells]);

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
    /**
     * Switching a project runs the last third of the formation backwards and
     * forwards again: the single plane hands back to its cells (identical
     * pixels), the image underneath them changes, and the cells re-seal onto
     * it. Nothing is rebuilt — it is the same grid, the same surface.
     */
    swap.current = {
      out: () => { set(el, "data-solid", false); set(el, "data-seal", false); set(el, "data-swap"); },
      in: () => { set(el, "data-swapin"); set(el, "data-seal"); },
      done: () => { set(el, "data-swap", false); set(el, "data-swapin", false); set(el, "data-solid"); },
    };

    set(stage, bornAs === "spotlight" ? "data-x-spotlight" : "data-x-work");
    if (bornAs === "spotlight") el.setAttribute("data-variant", "spotlight");

    let layout = computeLayout();
    // Spotlight until it hands its surface on to Work; then the same
    // rectangle animates back to the Work plane (CSS transition).
    let spotlight = bornAs === "spotlight";
    const measure = () => {
      layout = computeLayout();
      applyLayout(el, layout, spotlight);
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
      ready.current = true;
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
      ready.current = false;
      ["data-solid", "data-ui", "data-echo", "data-link", "data-glitch", "data-swap", "data-swapin"].forEach((n) => set(el, n, false));
      if (to === "about") targets.current = mapToPanels(el, layout);
    };
    /** Step 2: the move itself. */
    const depart = (to: Target) => {
      if (to === "about") {
        set(el, "data-drift", false);
        set(el, "data-to-about");
        runCellMove(el, targets.current, "to", cells);
      } else {
        set(el, "data-leaving");
      }
    };

    // Reduced motion: settled states at once, no frame loop.
    if (stillAtMount) {
      ["data-form", "data-seal", "data-ui", "data-echo", "data-solid"].forEach((n) => set(el, n));
      // no frame loop here, so the identity beside the surface is revealed now
      if (bornAs === "spotlight") set(stage, "data-sp-ui");
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
    const sp = bornAs === "spotlight";
    const rate = sp ? SPOTLIGHT.rate : 1;
    const cuesIn = sp ? SPOTLIGHT.cues : origin === "about" ? WORK_CUES_FROM_ABOUT : WORK_CUES_IN;
    const end = sp ? SPOTLIGHT.end : origin === "about" ? WORK_ABOUT.end : WORK_IN.end;
    let vhsDone = false;
    let handedOn: number | null = null;
    let handedArrived = false;

    let caseOn = false;
    const frame = (now: number) => {
      // ---- the surface becomes a case-study hero ------------------------------
      if (toCaseRef.current) {
        if (!caseOn) {
          caseOn = true;
          ready.current = false;
          // face the camera, and grow until the plane fills the screen; the
          // case study's own hero takes over this exact rectangle.
          const c = caseSurface(layout);
          el.style.setProperty("--sp-scale", String(c.scale));
          el.style.setProperty("--sp-x", `${Math.round(c.dx * 100) / 100}px`);
          el.style.setProperty("--sp-y", `${Math.round(c.dy * 100) / 100}px`);
          set(el, "data-to-case");
          set(el, "data-drift", false);
          cue("align");
          triggerVhs({ strength: 0.35 });
        }
        return;
      }
      if (caseOn) {
        // The case study has let go: the same rectangle travels back to its
        // plane and takes up the environment's geometry again.
        caseOn = false;
        applyLayout(el, layout, false);
        set(el, "data-to-case", false);
        set(el, "data-drift");
        ready.current = true;
        cue("align");
      }

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

      // ---- the spotlight hands its surface on to Work --------------------------
      if (sp && toWorkRef.current) {
        if (handedOn === null) {
          handedOn = now;
          spotlight = false;
          applyLayout(el, layout, false);       // the surface travels to the Work plane
          el.setAttribute("data-variant", "to-work");   // its index waits for it
          set(stage, "data-x-spotlight", false);
          set(stage, "data-sp-ui", false);
          set(stage, "data-x-work");
          cue("align");
        } else if (!handedArrived && now - handedOn >= HANDOVER) {
          handedArrived = true;
          el.removeAttribute("data-variant");   // Work's own index resolves
          arrive.current();
        }
        return;
      }

      // ---- arriving -----------------------------------------------------------
      if (arrived) return;
      const t = ((now - start) / 1000) * rate;

      if (origin === "about") {
        // Raised on the first frame, after the panel-shaped cells have painted.
        if (!on.has("w:data-regroup")) {
          set(el, "data-regroup");
          runCellMove(el, targets.current, "from", cells);
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
      // The identity beside the surface resolves once the surface has locked.
      if (sp && t >= WORK_IN.ui) set(stage, "data-sp-ui");
      // One short analog moment, where abstract geometry becomes a display.
      if (sp && !vhsDone && t >= SPOTLIGHT.vhsAt) {
        vhsDone = true;
        if (!stillAtMount) triggerVhs({ strength: 0.6 });
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
      swap.current = null;
      ready.current = false;
      cleanup();
    };
  }, [cue, stillAtMount, origin, bornAs, cells]);

  // Clear the switch's timers if the environment leaves mid-switch.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /**
   * Move the surface to another project. The environment stays exactly where
   * it is — the same cells, the same plane, the same camera — and only what
   * they are showing changes. Refused while the surface is still forming or
   * already switching, the way the state machine refuses navigation mid-move.
   */
  const switchTo = useCallback((next: number) => {
    const target = PROJECTS[next];
    if (!target || next === at.current || busy.current || !ready.current) return;

    // Reduced motion: the index simply reads differently now.
    if (stillAtMount) {
      at.current = next;
      setIndex(next);
      return;
    }

    busy.current = true;
    at.current = next;
    setSwitching(true);
    // Ask for the new still now, so it is decoded before the tiles uncover it.
    const src = mediaStill(target, mw);
    if (src) new Image().src = src;

    swap.current?.out();
    cue("release");
    timers.current.forEach(clearTimeout);
    timers.current = [
      window.setTimeout(() => {
        // Under the tiles: the surface is already the new project here.
        setIndex(next);
        triggerVhs({ strength: 0.3 });
        cue("align");
      }, WORK_SWAP.media),
      window.setTimeout(() => { swap.current?.in(); cue("snap"); }, WORK_SWAP.geometry),
      window.setTimeout(() => {
        swap.current?.done();
        busy.current = false;
        setSwitching(false);
      }, WORK_SWAP.end),
    ];
  }, [cue, mw, stillAtMount]);

  const step = (d: number) => switchTo((at.current + d + PROJECTS.length) % PROJECTS.length);

  const hover = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && !busy.current) cue("hover");
  };

  const total = String(PROJECTS.length).padStart(2, "0");

  return (
    <div
      ref={root}
      className="work"
      data-origin={origin}
      data-empty={project.media ? undefined : true}
      style={{ ["--media" as string]: still_ ? `url(${still_})` : "none" }}
    >
      <div className="work-3d">
        <div className="work-origin">
          <div className="work-plane">
            <svg
              className="work-wire"
              viewBox={`-120 -90 ${PLANE.w + 240} ${PLANE.h + 180}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d={wire} fill="none" stroke="#7d7d7d" strokeWidth="0.7" strokeOpacity="0.45" vectorEffect="non-scaling-stroke" />
            </svg>

            <div className="work-ghost" aria-hidden="true" />

            <div className="work-cells" aria-hidden="true">
              {cells.map((cell) => (
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

            {project.media ? (
              <figure className="work-media" data-cursor="view">
                {project.media.kind === "video" ? (
                  <video
                    src={project.media.src}
                    poster={project.media.poster}
                    preload="metadata"
                    muted
                    loop
                    playsInline
                    autoPlay
                    aria-label={project.media.alt}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={still_}
                    decoding="async"
                    width={project.media.width}
                    height={project.media.height}
                    alt={project.media.alt ?? ""}
                    draggable={false}
                  />
                )}
              </figure>
            ) : (
              /* Nothing invented in its place: the surface stays a surface,
                 and says what it is waiting for. */
              <p className="work-soon" aria-hidden="true">
                <span>{"// Coming soon"}</span>
                <span>{project.title}</span>
              </p>
            )}
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
          {/* A row exists only when there is something true to put in it —
              and "Discipline: Coming soon" is not a discipline. */}
          {project.comingSoon ? null : <div><dt>Discipline</dt><dd>{project.discipline}</dd></div>}
          {project.year ? <div><dt>Year</dt><dd>{project.year}</dd></div> : null}
          {project.status ? <div><dt>Status</dt><dd>{project.status}</dd></div> : null}
        </dl>
        {/* Opening the case study is an action on the project, not on the
            environment — so it sits with the identity, not in the chrome. */}
        <div className="work-cta" style={{ ["--d" as string]: "190ms" }}>
          {project.caseStudy ? (
            <a
              className="work-cta__open"
              href={`/work/${project.slug}`}
              data-cursor="view"
              onPointerEnter={hover}
              onClick={(e) => {
                if (!onOpenCase || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                cue("select");
                onOpenCase(project.slug);
              }}
            >
              Open case study
              <ArrowUpRight size={12} strokeWidth={1.6} aria-hidden="true" />
            </a>
          ) : (
            // No page is claimed until one exists. Not a disabled control:
            // there is nothing here to operate, only something to read.
            <p className="work-cta__open" data-pending>
              Case study
              <span>{project.comingSoon ? "// Coming soon" : "// In preparation"}</span>
            </p>
          )}
        </div>

        <p className="work-info__indexlabel" style={{ ["--d" as string]: "220ms" }}>
          Index · {project.id} / {total}
        </p>

        {/* The collection, readable without touching the arrows: every
            project, its number, and what it was. */}
        <ul
          className="work-index"
          style={{ ["--d" as string]: "250ms" }}
          aria-label="Projects"
          onKeyDown={(e) => {
            const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
            if (!d) return;
            e.preventDefault();
            const next = (at.current + d + PROJECTS.length) % PROJECTS.length;
            switchTo(next);
            e.currentTarget.querySelectorAll<HTMLButtonElement>(".work-index__row")[next]?.focus();
          }}
        >
          {PROJECTS.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className="work-index__row"
                data-current={i === index || undefined}
                aria-current={i === index ? "true" : undefined}
                data-cursor="view"
                onPointerEnter={hover}
                onClick={() => { cue("select"); switchTo(i); }}
              >
                <span className="work-index__n">{p.id}</span>
                <span className="work-index__t">{p.title}</span>
                <span className="work-index__d">{p.comingSoon ? "Coming soon" : p.discipline}</span>
              </button>
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
          <span className="work-foot__ctl">
            <button
              type="button"
              className="work-ctl"
              aria-label="Previous project"
              aria-disabled={switching || undefined}
              data-cursor="prev"
              onPointerEnter={hover}
              onClick={() => step(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="work-ctl"
              aria-label="Next project"
              aria-disabled={switching || undefined}
              data-cursor="next"
              onPointerEnter={hover}
              onClick={() => step(1)}
            >
              ›
            </button>
          </span>
        </div>
      </footer>
    </div>
  );
}
