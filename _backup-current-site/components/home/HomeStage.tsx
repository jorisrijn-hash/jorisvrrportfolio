"use client";

import { useEffect, useRef, useState } from "react";
import { IDLE_LOOP, XFER, XFER_CUES } from "@/content/transition";
import { ABOUT_IN, ABOUT_OUT } from "@/content/about";
import { WORK_IN, WORK_OUT, fedCells } from "@/content/work";
import { SPOTLIGHT } from "@/content/spotlight";
import { OBJECT_COUNT, createScene, type DrawFace } from "@/lib/sculpture/scene";
import { clamp01, seg } from "@/lib/sculpture/math";
import { addTick } from "@/lib/ticker";
import { computeLayout, type Layout } from "@/lib/layout";
import { useSound } from "@/lib/sound";
import { dev } from "@/lib/dev";

const SVG = "http://www.w3.org/2000/svg";
const GRAY = Array.from({ length: 256 }, (_, g) => `rgb(${g},${g},${g})`);
const q50 = (v: number) => Math.round(v * 50) / 50;
/** Lite screens quantise shading harder, for the same reason as `prec` in
 *  scene.ts: a fill or fill-opacity write costs a style invalidation. */
const q20 = (v: number) => Math.round(v * 20) / 20;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Seconds over which the idle loop eases in from the transition's stillness. */
const IDLE_RAMP = 2;
/** Cursor influence: rotation, and a depth parallax that moves near geometry most. */
const TILT_YAW = (8 * Math.PI) / 180;
const TILT_PITCH = (5 * Math.PI) / 180;
const SHIFT_X = 26;
const SHIFT_Y = 14;
/** How far a hovered asset grows. */
const HOVER_SCALE = 1.12;
/** Controls take the pointer; the sculpture only reacts over open space. */
const CONTROL = "button, a[href], [role='button'], input, [data-cursor], .about__panel";

/** Glitch timing for the fake crash, seconds. */
const CRASH_RAMP = 1.1;

export type StageMode =
  | "home" | "to-about" | "about" | "to-home"
  | "home-to-work" | "work" | "work-to-home" | "work-to-about" | "about-to-work"
  // Featured Work: the same formation, faster and on the smaller plane
  | "to-spotlight" | "spotlight" | "spotlight-to-home" | "spotlight-to-work";

type Slot = { el: SVGPathElement; d: string; g: number; fa: number; sa: number };

const hash = (n: number) => {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
};

function inside(pts: number[], x: number, y: number) {
  let hit = false;
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const yi = pts[i + 1];
    const yj = pts[j + 1];
    if (yi > y !== yj > y && x < ((pts[j] - pts[i]) * (y - yi)) / (yj - yi) + pts[i]) hit = !hit;
  }
  return hit;
}

/**
 * LOADING -> HOME, and the home it lands in.
 *
 * ONE controller. A single subscription to the shared frame clock computes the
 * timeline position and, from that alone:
 *   · evaluates and draws the sculpture (paths written straight to the DOM)
 *   · raises the stage attributes that CSS turns into bloom, retract and UI
 *   · fires each sound event exactly once
 *   · reports arrival, which moves the state machine to `home`
 *
 * In home it also hit-tests the pointer against the projected faces, so each
 * separate asset can grow under the cursor; on [REBUILD] it freezes and tears
 * the drawing for the fake crash; and toward About it folds the sculpture into
 * the centre (and stops drawing it entirely while About is open).
 *
 * Nothing here causes a React render after mount.
 *
 *   intro = true   the full transition, then the idle loop
 *   intro = false  arrive directly in home (returning visitor)
 *   still = true   reduced motion: one frame of the home pose, no loop
 */
export function HomeStage({
  intro,
  still,
  crashing,
  mode,
  paused = false,
  onArrive,
}: {
  intro: boolean;
  still: boolean;
  crashing: boolean;
  mode: StageMode;
  /** a case study has the screen: the scene is not visible, so stop drawing */
  paused?: boolean;
  onArrive: () => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const halted = useRef(paused);
  useEffect(() => { halted.current = paused; }, [paused]);
  const faceGroup = useRef<SVGGElement>(null);
  const orbitPath = useRef<SVGPathElement>(null);
  const stemPath = useRef<SVGPathElement>(null);
  const linkPath = useRef<SVGPathElement>(null);
  const dotPath = useRef<SVGPathElement>(null);
  const { cue } = useSound();

  // Captured once: the prop flips to false when the state reaches `home`, and
  // that must not restart the timeline.
  const [runIntro] = useState(intro && !still);
  const arrive = useRef(onArrive);
  const crash = useRef(crashing);
  const modeRef = useRef(mode);
  useEffect(() => { arrive.current = onArrive; }, [onArrive]);
  useEffect(() => { crash.current = crashing; }, [crashing]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // Reduced motion has no frame loop, so it swaps visibility directly.
  useEffect(() => {
    if (still && svg.current) svg.current.style.visibility = mode === "home" ? "" : "hidden";
  }, [still, mode]);

  useEffect(() => {
    const root = svg.current;
    const group = faceGroup.current;
    const stage = root?.closest<HTMLElement>(".experience");
    if (!root || !group || !stage) return;
    const html = document.documentElement;

    const evaluate = createScene();
    const slots: Slot[] = [];
    const flags = new Set<string>();
    const raise = (name: string) => {
      if (flags.has(name)) return;
      flags.add(name);
      stage.setAttribute(name, "");
    };

    if (!runIntro) {
      raise("data-x-instant");
      raise("data-x-retract");
      raise("data-x-bloom");
      raise("data-x-ui");
    }

    let layout: Layout = computeLayout();
    const measure = () => {
      layout = computeLayout();
      root.style.top = `${layout.stageY * 100}%`;
    };
    measure();
    window.addEventListener("resize", measure);

    // Pointer — targets only; the frame interpolates toward them.
    const pointer = { x: 0, y: 0, present: false, overControl: false, movedAt: -Infinity };
    const tilt = { x: 0, y: 0, sx: 0, sy: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.movedAt = performance.now();
      pointer.present = e.pointerType === "mouse" || e.pointerType === "pen";
      pointer.overControl = !!(e.target as Element | null)?.closest?.(CONTROL);
    };
    const onLeave = () => { pointer.present = false; };
    // Touch screens have no hover and no cursor to follow: no pointer tracking.
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!still && finePointer) {
      window.addEventListener("pointermove", onMove, { passive: true });
      html.addEventListener("mouseleave", onLeave);
    }

    const hover = new Float32Array(OBJECT_COUNT).fill(1);
    let hovered = -1;
    let faces: DrawFace[] = [];

    const setHovered = (id: number) => {
      if (id === hovered) return;
      hovered = id;
      if (id >= 0) {
        // Sound answers the hand, not the geometry: a piece re-forming under a
        // pointer that is standing still (after a scroll or a transition)
        // grows, but stays quiet.
        if (performance.now() - pointer.movedAt < 250) cue("hover");
        html.setAttribute("data-sculpt-hover", "");
      } else {
        html.removeAttribute("data-sculpt-hover");
      }
    };

    // The blend between the idle loop and a running move, the camera, and the
    // settle that ends a move — all derived from the same frame, so there is
    // only ever one clock shaping the object.
    let idleW = 1;
    let settleAt: number | null = null;
    let wasResting = true;
    let camF = 1600;
    let camX = 0;
    let camY = 0;
    let settle = 0;

    let lastOpacity = -1;
    const setAttr = (el: Element | null, name: string, v: string) => el?.setAttribute(name, v);

    const draw = (t: number, loop: number, glitch: number | null, collapse: number, work: number, spotlight = false) => {
      const lite = layout.lite;
      const f = evaluate({
        t, loop, fit: layout.fit,
        // the spotlight's cubes land on the smaller, set-aside plane
        layout: spotlight ? { ...layout, plane: layout.spotlight.plane } : layout,
        // The notification is a panel in the corner: the sculpture keeps its
        // place and only the cubes with a cell leave it. A tenth of the
        // reconfiguration is a shift of a few units, which is the whole of
        // the environment's reaction.
        spread: spotlight ? work * 0.1 : work,
        feed: spotlight ? fedCells(layout.spotlight.plane.cols, layout.spotlight.plane.rows) : undefined,
        hover, collapse, work,
        tiltX: tilt.x, tiltY: tilt.y, shiftX: tilt.sx, shiftY: tilt.sy,
        idleW, camF, camX, camY, settle,
      });
      faces = f.faces;

      if (f.opacity !== lastOpacity) {
        lastOpacity = f.opacity;
        root.style.opacity = String(f.opacity);
      }

      while (slots.length < f.faces.length) {
        const el = document.createElementNS(SVG, "path");
        el.setAttribute("stroke-opacity", "0");
        group.appendChild(el);
        slots.push({ el, d: "", g: -1, fa: -1, sa: 0 });
      }

      // Crash tear: faces are sheared sideways in horizontal bands that change
      // every 60ms, a few go dark, and the whole thing escalates.
      const step = glitch === null ? 0 : Math.floor(glitch / 0.06);
      const heat = glitch === null ? 0 : Math.min(1, glitch / CRASH_RAMP);

      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        const face = f.faces[i];
        if (!face) {
          if (s.d) { s.d = ""; s.el.setAttribute("d", ""); }
          continue;
        }

        let d = face.d;
        let g = lite ? Math.round(face.g / 4) * 4 : Math.round(face.g);
        if (glitch !== null && face.pts.length) {
          let cy = 0;
          for (let j = 1; j < face.pts.length; j += 2) cy += face.pts[j];
          cy /= face.pts.length / 2;
          const band = Math.floor((cy + 2000) / 34);
          const r = hash(band * 131.7 + step * 977.3);
          if (r > 0.78 - 0.4 * heat) {
            const dx = (hash(band * 7.1 + step * 13.9) - 0.5) * (30 + 220 * heat);
            d = "";
            for (let j = 0; j < face.pts.length; j += 2) {
              d += (j ? "L" : "M") + r1(face.pts[j] + dx) + " " + r1(face.pts[j + 1]);
            }
            d += "Z";
          }
          if (hash(i * 3.3 + step * 51.1) > 0.97 - 0.05 * heat) g = 28;
        }

        if (d !== s.d) { s.d = d; s.el.setAttribute("d", d); }
        if (g !== s.g) { s.g = g; s.el.setAttribute("fill", GRAY[g]); }
        const fa = lite ? q20(face.fa) : q50(face.fa);
        if (fa !== s.fa) { s.fa = fa; s.el.setAttribute("fill-opacity", String(fa)); }
        const sa = lite ? q20(face.sa) : q50(face.sa);
        if (sa !== s.sa) { s.sa = sa; s.el.setAttribute("stroke-opacity", String(sa)); }
      }

      if (glitch !== null) {
        const jx = (hash(step * 1.7) - 0.5) * 24 * heat;
        const jy = (hash(step * 2.9) - 0.5) * 8 * heat;
        root.style.transform = `translate(${r1(jx)}px, ${r1(jy)}px)`;
      }

      setAttr(orbitPath.current, "d", f.orbit);
      setAttr(orbitPath.current, "stroke-opacity", String(q50(f.orbitA)));
      setAttr(stemPath.current, "d", f.stem);
      setAttr(stemPath.current, "stroke-opacity", String(q50(f.stemA)));
      if (f.linkA > 0) {
        setAttr(linkPath.current, "d", f.links);
        setAttr(dotPath.current, "d", f.dots);
      }
      setAttr(linkPath.current, "stroke-opacity", String(q50(f.linkA * 0.4)));
      setAttr(dotPath.current, "fill-opacity", String(q50(f.linkA * 0.8)));
    };

    if (still) {
      const redraw = () => draw(XFER.end, 0, null, 0, 0);
      redraw();
      arrive.current();
      window.addEventListener("resize", redraw);
      return () => {
        window.removeEventListener("resize", measure);
        window.removeEventListener("resize", redraw);
        flags.forEach((n) => stage.removeAttribute(n));
      };
    }

    const start = performance.now();
    let cueIndex = runIntro ? 0 : XFER_CUES.length;
    let arrivedAt: number | null = runIntro ? null : start;
    if (!runIntro) arrive.current();
    let loop = 0;
    let loops = -1;
    let crashAt: number | null = null;
    let lastMode: StageMode = modeRef.current;
    let modeAt = start;
    let hidden = false;
    let skip = false;
    let lastWork = 0;
    let workAtLeave: number = SPOTLIGHT.outFrom;

    const frame = (now: number, dt: number) => {
      // Nothing of this is on screen while a case study is open, and a
      // projection nobody can see is the most expensive kind.
      if (halted.current) return;
      // The crash freezes time where it is and tears the last pose.
      if (crash.current) {
        if (crashAt === null) {
          crashAt = now;
          setHovered(-1);
        }
        draw(XFER.end, loop, (now - crashAt) / 1000, 0, 0);
        return;
      }

      const t = runIntro ? (now - start) / 1000 : XFER.end;

      // Stage attributes at their moments.
      if (t >= XFER.retract) raise("data-x-retract");
      if (t >= XFER.bloom) raise("data-x-bloom");
      if (t >= XFER.ui) raise("data-x-ui");

      // Sound: each event once, in order. An event more than a quarter second
      // late (a backgrounded tab) is dropped rather than stacked on the others.
      while (cueIndex < XFER_CUES.length && t >= XFER_CUES[cueIndex].at) {
        if (t - XFER_CUES[cueIndex].at < 0.25) cue(XFER_CUES[cueIndex].cue);
        cueIndex++;
      }

      if (arrivedAt === null && t >= XFER.end) {
        arrivedAt = now;
        arrive.current();
      }

      // About: fold into the centre, and back out.
      const m = modeRef.current;
      if (m !== lastMode) {
        // A close reverses from the pose the entrance had reached, not from
        // a reset: the spotlight can be dismissed while it is still forming.
        if (m === "spotlight-to-home") workAtLeave = lastWork;
        lastMode = m;
        modeAt = now;
      }
      const tm = (now - modeAt) / 1000;
      let collapse = 0;
      // Linear progress: the scene eases it, per group, so the hierarchy lives
      // in one place.
      if (m === "to-about" || m === "work-to-about") collapse = seg(tm, ABOUT_IN.collapse[0], ABOUT_IN.collapse[1]);
      else if (m === "about") collapse = 1;
      else if (m === "to-home" || m === "about-to-work") collapse = 1 - seg(tm, ABOUT_OUT.collapse[0], ABOUT_OUT.collapse[1]);

      // Featured work: the formation clock, and the same clock run backward.
      // The spotlight is that clock at SPOTLIGHT.rate, onto a smaller plane.
      let work = 0;
      const inSpotlight = m === "to-spotlight" || m === "spotlight" || m === "spotlight-to-home" || m === "spotlight-to-work";
      if (m === "home-to-work") work = Math.min(WORK_IN.end, tm);
      else if (m === "work" || m === "work-to-about" || m === "about-to-work") work = WORK_IN.end;
      else if (m === "work-to-home") work = Math.max(0, WORK_OUT.from - tm * WORK_OUT.rate);
      else if (m === "to-spotlight") work = Math.min(SPOTLIGHT.end, tm * SPOTLIGHT.rate);
      else if (m === "spotlight" || m === "spotlight-to-work") work = SPOTLIGHT.end;
      else if (m === "spotlight-to-home") {
        // Closing mid-entrance starts from wherever the formation had got to.
        work = Math.max(0, Math.min(SPOTLIGHT.outFrom, workAtLeave) - tm * WORK_OUT.rate * SPOTLIGHT.outRate);
      }
      const interactive = m === "home";

      // ---- one blend, one camera, one settle ---------------------------------
      // A move never cancels the idle loop: its influence eases down over
      // ~300ms and back up afterwards, so the transition starts from exactly
      // the pose the object is in. Work rests at 0.4 — quieter, not frozen.
      const resting = m === "home" || m === "work" || m === "about" || m === "spotlight";
      const idleTarget = !resting ? 0.25 : m === "home" ? 1 : 0.4;
      idleW += (idleTarget - idleW) * (1 - Math.exp(-dt / (resting ? 260 : 110)));

      if (resting !== wasResting) {
        wasResting = resting;
        if (resting) settleAt = now;
      }
      const sp = settleAt === null ? 1 : clamp01((now - settleAt) / 240);
      settle = (1 - sp) * (1 - sp);

      // The camera moves less than the geometry. Toward Work it breathes
      // forward and is back to neutral before the first cell locks — the cubes
      // have to land exactly on the CSS cells, so it cannot drift there.
      const wp = clamp01(work / 1.0);
      const ap = clamp01(collapse);
      camF = 1600 - 16 * Math.sin(Math.PI * wp) + 48 * ap;
      camX = 10 * ap;
      camY = -6 * ap;

      let e = 0;
      if (arrivedAt !== null) {
        // Idle clock, eased in so the loop starts from rest: t²/2R, then linear.
        e = (now - arrivedAt) / 1000;
        const tau = e < IDLE_RAMP ? (e * e) / (2 * IDLE_RAMP) : e - IDLE_RAMP / 2;
        loop = dev("NO_IDLE_MOTION") ? 0 : tau % IDLE_LOOP;

        const n = Math.floor(tau / IDLE_LOOP) % 100;
        if (n !== loops) {
          loops = n;
          const el = stage.querySelector("[data-loop]");
          if (el) el.textContent = String(n).padStart(2, "0");
        }

        // Cursor influence, from the viewport centre. Only in home.
        const on = interactive && pointer.present;
        const nx = on ? (pointer.x / window.innerWidth) * 2 - 1 : 0;
        const ny = on ? (pointer.y / window.innerHeight) * 2 - 1 : 0;
        const a = 1 - Math.exp(-dt / 380);
        tilt.y += (nx * TILT_YAW - tilt.y) * a;
        tilt.x += (-ny * TILT_PITCH - tilt.x) * a;
        tilt.sx += (nx * SHIFT_X - tilt.sx) * a;
        tilt.sy += (ny * SHIFT_Y - tilt.sy) * a;

        // Hover: the nearest face under the pointer names its asset.
        let hit = -1;
        if (interactive && pointer.present && !pointer.overControl) {
          const px = pointer.x - window.innerWidth / 2;
          const py = pointer.y - window.innerHeight * layout.stageY;
          for (let i = faces.length - 1; i >= 0; i--) {
            const fc = faces[i];
            if (fc.id < 0 || fc.fa < 0.3 || !fc.pts.length) continue;
            if (inside(fc.pts, px, py)) { hit = fc.id; break; }
          }
        }
        setHovered(hit);

        const h = 1 - Math.exp(-dt / 140);
        for (let i = 0; i < OBJECT_COUNT; i++) {
          const target = i === hovered ? HOVER_SCALE : 1;
          if (hover[i] !== target) {
            hover[i] += (target - hover[i]) * h;
            if (Math.abs(target - hover[i]) < 0.001) hover[i] = target;
          }
        }
      }

      // Fully folded away: nothing to draw while About is open.
      const gone = collapse >= 1;
      if (gone !== hidden) {
        hidden = gone;
        root.style.visibility = gone ? "hidden" : "";
      }
      if (gone) return;

      // Compact screens redraw the settled idle loop at 30fps; transitions
      // always run at full rate.
      if (layout.lite && arrivedAt !== null && m === "home" && (skip = !skip)) return;

      lastWork = work;
      draw(Math.min(t, XFER.end), loop, null, collapse, work, inSpotlight);
    };

    const stop = addTick(frame);
    return () => {
      stop();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onMove);
      html.removeEventListener("mouseleave", onLeave);
      html.removeAttribute("data-sculpt-hover");
      flags.forEach((n) => stage.removeAttribute(n));
    };
  }, [runIntro, still, cue]);

  return (
    <>
      <div className="bloom-layer" aria-hidden="true" />
      <svg ref={svg} className="sculpture" aria-hidden="true" style={{ opacity: 0 }}>
        <g fill="none">
          <path ref={orbitPath} stroke="var(--color-env-line)" strokeWidth="1" />
          <path ref={linkPath} stroke="#8e8e8e" strokeWidth="0.6" />
          <path ref={dotPath} fill="#a6a6a6" />
          <path ref={stemPath} stroke="currentColor" strokeWidth="1" />
        </g>
        <g ref={faceGroup} stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      </svg>
    </>
  );
}
