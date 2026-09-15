"use client";

import { useEffect, useRef, useState } from "react";
import { IDLE_LOOP, XFER, XFER_CUES } from "@/content/transition";
import { createScene } from "@/lib/sculpture/scene";
import { addTick } from "@/lib/ticker";
import { useSound } from "@/lib/sound";

const SVG = "http://www.w3.org/2000/svg";
const GRAY = Array.from({ length: 256 }, (_, g) => `rgb(${g},${g},${g})`);
const q50 = (v: number) => Math.round(v * 50) / 50;

/** Seconds over which the idle loop eases in from the transition's stillness. */
const IDLE_RAMP = 2;
/** Cursor influence: at most ±3° yaw, ±2° pitch. */
const TILT_YAW = (3 * Math.PI) / 180;
const TILT_PITCH = (2 * Math.PI) / 180;

type Slot = { el: SVGPathElement; d: string; g: number; fa: number; sa: number };

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
 * Nothing here causes a React render after mount.
 *
 *   intro = true   the full transition, then the idle loop
 *   intro = false  arrive directly in home (returning visitor)
 *   still = true   reduced motion: one frame of the home pose, no loop
 */
export function HomeStage({
  intro,
  still,
  onArrive,
}: {
  intro: boolean;
  still: boolean;
  onArrive: () => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
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
  useEffect(() => { arrive.current = onArrive; }, [onArrive]);

  useEffect(() => {
    const root = svg.current;
    const group = faceGroup.current;
    const stage = root?.closest<HTMLElement>(".experience");
    if (!root || !group || !stage) return;

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

    let fit = 1;
    const measure = () => {
      fit = Math.min(1.25, Math.max(0.5, Math.min(window.innerWidth / 1920, window.innerHeight / 950)));
    };
    measure();
    window.addEventListener("resize", measure);

    // Cursor influence — targets only; the frame interpolates toward them.
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      tilt.ty = ((e.clientX / window.innerWidth) * 2 - 1) * TILT_YAW;
      tilt.tx = -((e.clientY / window.innerHeight) * 2 - 1) * TILT_PITCH;
    };
    if (!still) window.addEventListener("pointermove", onMove, { passive: true });

    let lastOpacity = -1;
    const setAttr = (el: Element | null, name: string, v: string) => el?.setAttribute(name, v);

    const draw = (t: number, loop: number) => {
      const f = evaluate({ t, loop, tiltX: tilt.x, tiltY: tilt.y, fit });

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

      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        const face = f.faces[i];
        if (!face) {
          if (s.d) { s.d = ""; s.el.setAttribute("d", ""); }
          continue;
        }
        if (face.d !== s.d) { s.d = face.d; s.el.setAttribute("d", face.d); }
        const g = Math.round(face.g);
        if (g !== s.g) { s.g = g; s.el.setAttribute("fill", GRAY[g]); }
        const fa = q50(face.fa);
        if (fa !== s.fa) { s.fa = fa; s.el.setAttribute("fill-opacity", String(fa)); }
        const sa = q50(face.sa);
        if (sa !== s.sa) { s.sa = sa; s.el.setAttribute("stroke-opacity", String(sa)); }
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
      const redraw = () => draw(XFER.end, 0);
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

    const frame = (now: number, dt: number) => {
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

      // Idle clock, eased in so the loop starts from rest: t²/2R, then linear.
      let loop = 0;
      if (arrivedAt !== null) {
        const e = (now - arrivedAt) / 1000;
        const tau = e < IDLE_RAMP ? (e * e) / (2 * IDLE_RAMP) : e - IDLE_RAMP / 2;
        loop = tau % IDLE_LOOP;

        const a = 1 - Math.exp(-dt / 260);
        tilt.x += (tilt.tx - tilt.x) * a;
        tilt.y += (tilt.ty - tilt.y) * a;
      }

      draw(Math.min(t, XFER.end), loop);
    };

    const stop = addTick(frame);
    return () => {
      stop();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onMove);
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
