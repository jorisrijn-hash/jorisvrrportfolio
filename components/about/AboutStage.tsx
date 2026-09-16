"use client";

import { useEffect, useRef, useState } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { FeatureCollection } from "geojson";
import { ABOUT } from "@/content/site";
import { ABOUT_CUES_IN, ABOUT_CUES_OUT, ABOUT_IN, ABOUT_LABELS, ABOUT_OUT, GLOBE } from "@/content/about";
import { clamp01, inOut, lerp, outQuart, seg, smooth } from "@/lib/sculpture/math";
import { addTick } from "@/lib/ticker";
import { computeLayout } from "@/lib/layout";
import { useSound } from "@/lib/sound";

/* ------------------------------------------------------------ land data */

type Land = FeatureCollection;
type Lands = { fine: Land; coarse: Land };
let landPromise: Promise<Lands | null> | null = null;

const loadLand = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((topo: Topology<{ land: GeometryCollection }>) => feature(topo, topo.objects.land) as Land);

/**
 * Natural Earth land (world-atlas), served as static files and fetched only
 * when About is first wanted — hovering [ABOUT] starts it early.
 *
 *   fine    1:50m, drawn while the globe holds or drifts
 *   coarse  1:110m, drawn every frame while it spins away (detail is lost to
 *           the motion anyway, and it is ~10x cheaper to project)
 */
export function preloadGlobe(): Promise<Lands | null> {
  if (!landPromise) {
    landPromise = Promise.all([loadLand("/data/land-50m.json"), loadLand("/data/land-110m.json")])
      .then(([fine, coarse]) => ({ fine, coarse }))
      .catch(() => {
        landPromise = null;
        return null;
      });
  }
  return landPromise;
}

/** Re-project the fine coastline only once the view has turned this far. */
const LAND_STEP = 0.12;

const GRATICULE = geoGraticule10();
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * ABOUT — the globe, its orbit rings and the three glass panels, rebuilt
 * natively from maintoabout.mp4. No canvas, no WebGL, no video: the globe is
 * an orthographic projection of real land outlines into one SVG path.
 *
 * Its own subscription to the shared frame clock drives:
 *   · the rings contracting in, the orbit dot, the globe forming and turning
 *   · stage attributes CSS turns into labels and panels (no per-frame styles)
 *   · the sound events, each once
 *   · arrival, which moves the state machine on
 *
 *   leaving = false   home -> about, then holds
 *   leaving = true    about -> home: panels lift, the globe spins away
 */
export function AboutStage({
  leaving,
  leavingTo = "home",
  fromWork = false,
  still,
  onArrive,
  onClose,
}: {
  leaving: boolean;
  /** where About is going: home spins away and reports arrival; work hands
   *  its panels straight to Work's cells, and Work reports arrival */
  leavingTo?: "home" | "work";
  /** entered from Work: the panels take over from cells already in place */
  fromWork?: boolean;
  still: boolean;
  onArrive: () => void;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const globeGroup = useRef<SVGGElement>(null);
  const landPath = useRef<SVGPathElement>(null);
  const gratPath = useRef<SVGPathElement>(null);
  const ringOuter = useRef<SVGCircleElement>(null);
  const ringInner = useRef<SVGCircleElement>(null);
  const dotOuter = useRef<SVGCircleElement>(null);
  const dotInner = useRef<SVGCircleElement>(null);
  const { cue } = useSound();

  const leavingRef = useRef(leaving);
  const leavingToRef = useRef(leavingTo);
  useEffect(() => { leavingToRef.current = leavingTo; }, [leavingTo]);
  const [fromWorkAtMount] = useState(fromWork);
  const arrive = useRef(onArrive);
  const close = useRef(onClose);
  useEffect(() => { leavingRef.current = leaving; }, [leaving]);
  useEffect(() => { arrive.current = onArrive; }, [onArrive]);
  useEffect(() => { close.current = onClose; }, [onClose]);
  const [stillAtMount] = useState(still);

  useEffect(() => {
    const el = root.current;
    const globe = globeGroup.current;
    const stage = el?.closest<HTMLElement>(".experience");
    if (!el || !globe || !stage) return;

    const flags = new Set<string>();
    const raise = (target: HTMLElement, name: string, on = true) => {
      const key = `${target === stage ? "s" : "a"}:${name}`;
      if (on === flags.has(key)) return;
      if (on) {
        flags.add(key);
        target.setAttribute(name, "");
      } else {
        flags.delete(key);
        target.removeAttribute(name);
      }
    };
    raise(stage, "data-x-about");

    const measure = () => {
      const L = computeLayout();
      el.style.setProperty("--fit", String(L.fit));
      el.style.setProperty("--gfit", String(L.globeFit));
      el.style.setProperty("--globe-y", `${L.globeY * 100}%`);
      el.style.setProperty("--stage-y", `${L.stageY * 100}%`);
    };
    measure();
    window.addEventListener("resize", measure);

    let land: Lands | null = null;
    void preloadGlobe().then((l) => { land = l; });

    // No adaptive resampling: at this radius the source vertices are already
    // denser than a pixel, and resampling was most of the per-frame cost.
    const projection = geoOrthographic().scale(GLOBE.r).translate([0, 0]).clipAngle(90).precision(0);
    const path = geoPath(projection);

    let lastLand = "";
    let lastGrat = "";
    let landKey = "";

    /**
     * Attributes are only written when their value actually changes.
     * Every write repaints the globe, and a repaint re-composites the
     * full-screen atmosphere layers above and below it: writing the same
     * values each frame cost ~25% of frames in the settled About state.
     */
    const written = new WeakMap<Element, Record<string, string>>();
    const put = (el: Element | null | undefined, name: string, v: string) => {
      if (!el) return;
      let c = written.get(el);
      if (!c) {
        c = {};
        written.set(el, c);
      }
      if (c[name] === v) return;
      c[name] = v;
      el.setAttribute(name, v);
    };

    /** One pose of the whole stage. p* are 0..1 progress values. */
    const pose = (o: {
      rings: number; wire: number; globe: number; spin: number; scale: number; seconds: number; orbit: number; fast?: boolean;
    }) => {
      const lon = -(GLOBE.lon + GLOBE.drift * o.seconds + o.spin);
      projection.rotate([lon, -GLOBE.lat, 0]);

      // Size is a group transform, so the projection never re-derives its scale.
      put(globe, "opacity", String(Math.round(Math.max(o.wire * 0.35, o.globe) * 100) / 100));
      put(globe, "transform", `scale(${Math.round(o.scale * 1000) / 1000})`);

      // The fine coastline is re-projected only when the view has actually
      // turned by LAND_STEP; the coarse one follows a fast spin every frame.
      // Projected once as soon as the land data is in (even while invisible),
      // so the first visible frame never pays for it.
      if (land && (o.globe > 0 || !lastLand)) {
        const key = o.fast ? `c${lon}` : `f${Math.round(lon / LAND_STEP)}`;
        if (key !== landKey) {
          landKey = key;
          const d = path(o.fast ? land.coarse : land.fine) ?? "";
          if (d !== lastLand) { lastLand = d; put(landPath.current, "d", d); }
        }
      }
      put(landPath.current, "fill-opacity", String(Math.round(o.globe * 100) / 100));

      const gA = o.wire * (1 - o.globe * 0.85);
      if (gA > 0.01 && !o.fast) {
        const d = path(GRATICULE) ?? "";
        if (d !== lastGrat) { lastGrat = d; put(gratPath.current, "d", d); }
      }
      put(gratPath.current, "stroke-opacity", String(Math.round(gA * 100) / 100));

      const ro = lerp(GLOBE.ringOuter + 50, GLOBE.ringOuter, outQuart(o.rings));
      const ri = lerp(GLOBE.ringInner + 40, GLOBE.ringInner, outQuart(o.rings));
      put(ringOuter.current, "r", String(r1(ro)));
      put(ringInner.current, "r", String(r1(ri)));
      const ringA = String(Math.round(smooth(o.rings) * 100) / 100);
      put(ringOuter.current, "stroke-opacity", ringA);
      put(ringInner.current, "stroke-opacity", ringA);

      // The orbit dot travels counter-clockwise, ~10°/s, as in the reference.
      const a = ((-37 - 10 * o.orbit) * Math.PI) / 180;
      put(dotOuter.current, "cx", String(r1(Math.cos(a) * ro)));
      put(dotOuter.current, "cy", String(r1(Math.sin(a) * ro)));
      put(dotOuter.current, "fill-opacity", ringA);
      const ai = a + 0.04;
      put(dotInner.current, "cx", String(r1(Math.cos(ai) * ri)));
      put(dotInner.current, "cy", String(r1(Math.sin(ai) * ri)));
      put(dotInner.current, "fill-opacity", String(Math.round(smooth(o.rings) * (1 - o.globe) * 100) / 100));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    window.addEventListener("keydown", onKey);

    const cleanup = () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("keydown", onKey);
      flags.forEach((key) => {
        const [who, name] = key.split(":");
        (who === "s" ? stage : el).removeAttribute(name);
      });
    };

    // Reduced motion: final states, no frame loop.
    if (stillAtMount) {
      raise(el, "data-panels");
      void preloadGlobe().then((l) => {
        land = l;
        pose({ rings: 1, wire: 0, globe: 1, spin: 0, scale: 1, seconds: 0, orbit: 0 });
      });
      pose({ rings: 1, wire: 0, globe: 1, spin: 0, scale: 1, seconds: 0, orbit: 0 });
      arrive.current();
      let left = false;
      const id = window.setInterval(() => {
        if (leavingRef.current && !left) {
          left = true;
          const toWork = leavingToRef.current === "work";
          raise(el, toWork ? "data-leaving-work" : "data-leaving");
          raise(stage, "data-x-about", false);
          if (!toWork) arrive.current();
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
    let spinAtLeave = 0;
    let orbitAtLeave = 0;

    const frame = (now: number) => {
      const t = (now - start) / 1000;

      if (leavingRef.current && leftAt === null) {
        leftAt = now;
        spinAtLeave = Math.max(0, t - ABOUT_IN.end);
        orbitAtLeave = t;
        raise(el, leavingToRef.current === "work" ? "data-leaving-work" : "data-leaving");
      }

      if (leftAt === null) {
        // ---- home -> about, then hold -------------------------------------
        if (t >= ABOUT_IN.labels) raise(el, "data-labels");
        if (t >= ABOUT_IN.online) raise(el, "data-online");
        if (t >= ABOUT_IN.labelsOut) raise(el, "data-labels-out");
        if (t >= ABOUT_IN.panels) raise(el, "data-panels");
        while (cueIn < ABOUT_CUES_IN.length && t >= ABOUT_CUES_IN[cueIn].at) {
          if (t - ABOUT_CUES_IN[cueIn].at < 0.25) cue(ABOUT_CUES_IN[cueIn].cue);
          cueIn++;
        }
        if (!arrived && t >= ABOUT_IN.end) {
          arrived = true;
          arrive.current();
        }


        const wire = seg(t, ABOUT_IN.wire[0], ABOUT_IN.wire[1]) * (1 - seg(t, ABOUT_IN.wireOut[0], ABOUT_IN.wireOut[1]) * 0.9);
        pose({
          rings: seg(t, ABOUT_IN.rings[0], ABOUT_IN.rings[1]),
          wire: smooth(wire),
          globe: inOut(seg(t, ABOUT_IN.globe[0], ABOUT_IN.globe[1])),
          spin: 0,
          scale: lerp(0.82, 1, outQuart(seg(t, ABOUT_IN.wire[0], ABOUT_IN.globe[1]))),
          // The globe only starts to drift once About has arrived: mid-transition
          // the fine coastline is projected once, not every LAND_STEP.
          seconds: Math.max(0, t - ABOUT_IN.end),
          orbit: t,
        });
        return;
      }

      // ---- about -> home --------------------------------------------------
      const u = (now - leftAt) / 1000;
      const toWork = leavingToRef.current === "work";
      // Toward Work, Work scores the formation; About only marks the release.
      const outCues = toWork ? ABOUT_CUES_OUT.slice(0, 1) : ABOUT_CUES_OUT;
      while (cueOut < outCues.length && u >= outCues[cueOut].at) {
        if (u - outCues[cueOut].at < 0.25) cue(outCues[cueOut].cue);
        cueOut++;
      }
      if (u >= ABOUT_OUT.ui) raise(stage, "data-x-about", false);
      if (!toWork && !leftArrived && u >= ABOUT_OUT.end) {
        leftArrived = true;
        arrive.current();
      }

      const g = inOut(seg(u, ABOUT_OUT.globe[0], ABOUT_OUT.globe[1]));
      pose({
        rings: 1 - seg(u, ABOUT_OUT.rings[0], ABOUT_OUT.rings[1]),
        wire: 0,
        globe: 1 - clamp01(g * 1.1),
        // spin away toward the Americas, as the reference does before it shatters
        spin: 200 * g * g,
        scale: lerp(1, 0.55, g),
        seconds: spinAtLeave,
        orbit: orbitAtLeave + u,
        fast: g > 0,
      });
    };

    const stop = addTick(frame);
    return () => {
      stop();
      cleanup();
    };
  }, [cue, stillAtMount]);

  return (
    <div ref={root} className="about" data-from-work={fromWorkAtMount || undefined}>
      <svg className="about__globe" aria-hidden="true">
        <defs>
          <radialGradient id="about-ocean" cx="0.62" cy="0.64" r="0.78">
            <stop offset="0" stopColor="#f7f7f8" />
            <stop offset="0.55" stopColor="#dcdcdf" />
            <stop offset="1" stopColor="#b9b9bd" />
          </radialGradient>
          <linearGradient id="about-land" gradientUnits="userSpaceOnUse" x1="-260" y1="-280" x2="240" y2="300">
            <stop offset="0" stopColor="#2f2f33" />
            <stop offset="0.5" stopColor="#57575c" />
            <stop offset="1" stopColor="#8a8a8f" />
          </linearGradient>
          <radialGradient id="about-limb" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.72" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.14" />
          </radialGradient>
        </defs>

        <g fill="none" stroke="#8b8b8b" strokeWidth="1.2">
          <circle ref={ringOuter} r={GLOBE.ringOuter} strokeOpacity="0" />
          <circle ref={ringInner} r={GLOBE.ringInner} strokeOpacity="0" />
        </g>
        <circle ref={dotOuter} r="9" fill="#8a8a8a" fillOpacity="0" />
        <circle ref={dotInner} r="5" fill="#6e6e6e" fillOpacity="0" />

        <g ref={globeGroup} opacity="0">
          <circle r={GLOBE.r} fill="url(#about-ocean)" />
          <path ref={landPath} fill="url(#about-land)" fillOpacity="0" />
          <circle r={GLOBE.r} fill="url(#about-limb)" />
          <path ref={gratPath} fill="none" stroke="#8d8d8d" strokeWidth="0.6" strokeOpacity="0" />
          <g fill="none" stroke="#ffffff" strokeOpacity="0.28">
            <circle r="150" strokeWidth="4" />
            <circle r="46" strokeWidth="2" />
          </g>
        </g>
      </svg>

      <div className="about__labels" aria-hidden="true">
        <p className="about__label" data-label="route">{ABOUT_LABELS.route}</p>
        <p className="about__label" data-label="handshake">{ABOUT_LABELS.handshake}</p>
        <p className="about__label" data-label="online">{ABOUT_LABELS.online}</p>
      </div>

      <section className="about__panels" aria-labelledby="about-lead">
        <article className="about__panel" data-panel="top">
          <Corners />
          <div className="about__inner">
            <p className="about__eyebrow">{"// Profile_Node · 01"}</p>
            <h1 id="about-lead" className="about__lead">{ABOUT.lead}</h1>
            <p className="about__summary">{ABOUT.summary}</p>
          </div>
        </article>

        <article className="about__panel" data-panel="meta">
          <Corners />
          <div className="about__inner">
            <p className="about__eyebrow">{"// Meta"}</p>
            <dl className="about__meta">
              {ABOUT.meta.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>
                    {row.href ? (
                      <a
                        className="about__meta-link"
                        href={row.href}
                        {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        onPointerEnter={(e) => {
                          if (e.pointerType === "mouse") cue("hover");
                        }}
                        onClick={() => cue("select")}
                      >
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </article>

        <article className="about__panel" data-panel="body">
          <Corners />
          <div className="about__inner">
            <p className="about__eyebrow">{"// Log"}</p>
            <div className="about__body" tabIndex={0} aria-label="About, in full">
              {ABOUT.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function Corners() {
  return (
    <>
      <i className="about__corner" data-c="tl" aria-hidden="true" />
      <i className="about__corner" data-c="tr" aria-hidden="true" />
      <i className="about__corner" data-c="bl" aria-hidden="true" />
      <i className="about__corner" data-c="br" aria-hidden="true" />
    </>
  );
}
