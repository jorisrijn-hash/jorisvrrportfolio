"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { FeatureCollection } from "geojson";
import { ABOUT, PROFILE, SOCIALS } from "@/content/site";
import { ABOUT_CUES_IN, ABOUT_CUES_OUT, ABOUT_IN, ABOUT_LABELS, ABOUT_OUT, GLOBE } from "@/content/about";
import { clamp01, easeSecondary, inOut, lerp, outQuart, seg, smooth } from "@/lib/sculpture/math";
import { addTick } from "@/lib/ticker";
import { computeLayout } from "@/lib/layout";
import { useSound } from "@/lib/sound";
import { triggerVhs } from "@/lib/vhs";

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
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Segments an orbit ring is drawn in while it forms (and breaks into as it leaves). */
const RING_SEGS = 56;

/**
 * The network the orbit system becomes at LINKS: five nodes on the two rings
 * (0 = outer, 1 = inner), three of them the channels in SOCIALS. Edges close
 * the five into a loop; the channels also connect to the centre.
 */
const NET: { id: string | null; ring: 0 | 1; a: number }[] = [
  { id: "instagram", ring: 0, a: -52 },
  { id: "youtube", ring: 1, a: 14 },
  { id: "linkedin", ring: 0, a: 128 },
  { id: null, ring: 1, a: 206 },
  { id: null, ring: 0, a: 262 },
];

/** A meridian crosses the visible face once every this many seconds. */
const SWEEP = 9;

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
  const globeSvg = useRef<SVGSVGElement>(null);
  const ocean = useRef<SVGCircleElement>(null);
  const limb = useRef<SVGCircleElement>(null);
  const outline = useRef<SVGCircleElement>(null);
  const meridian = useRef<SVGPathElement>(null);
  const netGroup = useRef<SVGGElement>(null);
  const netPath = useRef<SVGPathElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const linksSec = useRef<HTMLElement>(null);
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

  /** Hands the globe from its scroll timeline back to the frame loop. */
  const handoff = useRef<() => void>(() => {});

  // Leaving from further down the page: the page cuts back to its opening
  // under the VHS tear, before anything measures the panels (Work maps its
  // cells onto them in its own layout effect, which runs after this one).
  useLayoutEffect(() => {
    const sc = scroller.current;
    const el = root.current;
    if (!leaving || !sc || !el) return;
    handoff.current();
    el.removeAttribute("data-scroll");
    if (sc.scrollTop > 2) {
      el.setAttribute("data-cut", "");
      sc.scrollTop = 0;
      if (!stillAtMount) triggerVhs({ delay: 0, strength: 1 });
    }
  }, [leaving, stillAtMount]);

  /** A channel row under the pointer lights its node on the globe (bound in
   *  the effect, where the SVG exists). */
  const hot = useRef<(id: string | null) => void>(() => {});

  useEffect(() => {
    const el = root.current;
    const globe = globeGroup.current;
    const svgEl = globeSvg.current;
    const sc = scroller.current;
    const stage = el?.closest<HTMLElement>(".experience");
    if (!el || !globe || !svgEl || !sc || !stage) return;

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

    hot.current = (id) => {
      svgEl.querySelectorAll<SVGElement>("[data-node]").forEach((n) => {
        if (n.dataset.node === id) n.setAttribute("data-hot", "");
        else n.removeAttribute("data-hot");
      });
    };

    // Screen geometry, and where the page's parts sit in the scroll.
    const geo = { vw: 1, vh: 1, gfit: 1, compact: false, colRight: 0, linksTop: Infinity };
    const measure = () => {
      const L = computeLayout();
      el.style.setProperty("--fit", String(L.fit));
      el.style.setProperty("--gfit", String(L.globeFit));
      el.style.setProperty("--globe-y", `${L.globeY * 100}%`);
      el.style.setProperty("--stage-y", `${L.stageY * 100}%`);
      geo.vw = L.vw;
      geo.vh = L.vh;
      geo.gfit = L.globeFit;
      geo.compact = L.compact;
      const scRect = sc.getBoundingClientRect();
      const col = column.current?.getBoundingClientRect();
      if (col) geo.colRight = col.right - L.vw / 2;
      const links = linksSec.current?.getBoundingClientRect();
      if (links) geo.linksTop = links.top - scRect.top + sc.scrollTop;
    };
    measure();
    const onResize = () => {
      measure();
      if (glide) bindGlide();
    };
    window.addEventListener("resize", onResize);

    // ---- scroll ------------------------------------------------------------
    // Read on the event, applied on the frame: the frame never reads layout.
    let scrollTop = 0;
    let scrolled = false;
    // Reduced motion reshapes the globe straight from the scroll event; bound
    // further down, once the pose exists.
    let onStillScroll: (() => void) | null = null;
    const onScroll = () => {
      scrollTop = sc.scrollTop;
      const on = scrollTop > 24;
      if (on !== scrolled) {
        scrolled = on;
        if (on) el.setAttribute("data-scrolled", "");
        else el.removeAttribute("data-scrolled");
      }
      onStillScroll?.();
    };
    sc.addEventListener("scroll", onScroll, { passive: true });

    /** Scroll -> the two morph targets. sp: the opening is scrolled away.
     *  lp: LINKS has come up into the view. */
    const targets = () => ({
      sp: clamp01(scrollTop / (geo.vh * 0.85)),
      lp: clamp01((geo.vh * 0.85 - (geo.linksTop - scrollTop)) / (geo.vh * 0.4)),
    });

    // Sections settle in once, as they arrive.
    const seen = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        (e.target as HTMLElement).setAttribute("data-seen", "");
        seen.unobserve(e.target);
      }),
      { root: sc, threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    sc.querySelectorAll("[data-sec]").forEach((n) => (stillAtMount ? n.setAttribute("data-seen", "") : seen.observe(n)));

    /** Where the globe stands at an eased scroll progress e1 (0 = opening). */
    const placement = (e1: number) => {
      let gx = 0;
      let gy = 0;
      let gs = 1;
      let op = 1;
      if (geo.compact) {
        gs = lerp(1, 0.8, e1);
        gy = -0.06 * geo.vh * e1;
        op = 0.55 * (1 - 0.45 * e1);
      } else {
        // Beside the text column, never under it: the orbit's outer edge
        // clears the column, and may run off the right edge of the screen.
        gs = lerp(1, 0.6, e1);
        const R = GLOBE.ringOuter * gs * geo.gfit;
        const cx = Math.min(geo.colRight + R + 24, geo.vw / 2 - R * 0.35);
        gx = cx * e1;
        op = 1 - 0.08 * e1;
      }
      return {
        transform: `translate(${r1(gx)}px, ${r1(gy)}px) scale(${Math.round(geo.gfit * gs * 1000) / 1000})`,
        opacity: String(r2(op)),
      };
    };

    /**
     * The glide beside the text runs on the COMPOSITOR where it can: a scroll
     * timeline on the page drives the globe's transform directly, so it stays
     * locked to the scroll at full rate however busy the main thread is
     * (the JS morph commits a new layer tree each frame, and mid-scroll those
     * commits wait on raster). Elsewhere, and on the way out, `place` drives it.
     */
    type ScrollTimelineCtor = new (o: { source: Element; axis?: "block" }) => AnimationTimeline;
    const ST = (window as unknown as { ScrollTimeline?: ScrollTimelineCtor }).ScrollTimeline;
    let glide: Animation | null = null;
    const bindGlide = () => {
      glide?.cancel();
      glide = null;
      if (stillAtMount || !ST) return;
      const max = sc.scrollHeight - sc.clientHeight;
      if (max <= 0) return;
      const k = Math.min(1, (geo.vh * 0.85) / max);
      const a = placement(0);
      const z = placement(1);
      glide = svgEl.animate(
        [
          // easeSecondary, as cubic-bezier: the JS path uses the same curve
          { offset: 0, ...a, easing: "cubic-bezier(0.5, 0, 0.2, 1)" },
          { offset: k, ...z },
          { offset: 1, ...z },
        ],
        { timeline: new ST({ source: sc, axis: "block" }), fill: "both" },
      );
    };

    let lastPlace = "";
    const place = (e1: number) => {
      if (glide) return;
      const { transform, opacity } = placement(e1);
      const v = transform + opacity;
      if (v === lastPlace) return;
      lastPlace = v;
      svgEl.style.transform = transform;
      svgEl.style.opacity = opacity;
    };

    // Late content (fonts, the land data) can change the page's height.
    const grown = new ResizeObserver(() => {
      measure();
      if (glide) bindGlide();
    });
    if (column.current) grown.observe(column.current);

    let land: Lands | null = null;
    void preloadGlobe().then((l) => { land = l; });

    // No adaptive resampling: at this radius the source vertices are already
    // denser than a pixel, and resampling was most of the per-frame cost.
    const projection = geoOrthographic().scale(GLOBE.r).translate([0, 0]).clipAngle(90).precision(0);
    const path = geoPath(projection);

    let lastLand = "";
    let lastGrat = "";
    let landKey = "";
    let gratKey = "";

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
      /** surface -> linework */ line?: number;
      /** rings separate into flattened, crossing orbits */ flat?: number;
      /** the orbits become a network */ net?: number;
      /** the meridian sweep's strength; its phase follows `seconds` */ sweep?: number;
    }) => {
      const line = o.line ?? 0;
      const flat = o.flat ?? 0;
      const net = o.net ?? 0;
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
      // Surface -> linework: the land's fill gives way to its coastline, the
      // ocean thins to an outline, the graticule comes back up.
      put(landPath.current, "fill-opacity", String(r2(o.globe * (1 - 0.9 * line))));
      put(landPath.current, "stroke-opacity", String(r2(o.globe * line * 0.55)));
      put(ocean.current, "fill-opacity", String(r2(1 - 0.85 * line)));
      put(limb.current, "opacity", String(r2(1 - line)));
      put(outline.current, "stroke-opacity", String(r2(0.7 * line)));

      // Re-projected on the same LAND_STEP throttle as the coastline.
      const gA = Math.max(o.wire * (1 - o.globe * 0.85), 0.4 * line * o.globe);
      if (gA > 0.01 && !o.fast) {
        const key = `${Math.round(lon / LAND_STEP)}`;
        if (key !== gratKey) {
          gratKey = key;
          const d = path(GRATICULE) ?? "";
          if (d !== lastGrat) { lastGrat = d; put(gratPath.current, "d", d); }
        }
      }
      put(gratPath.current, "stroke-opacity", String(r2(gA)));

      // One meridian crossing the face, limb to limb: the line passing round
      // the globe. It fades at the limbs, so it never pops.
      const ph = (o.seconds / SWEEP) % 1;
      const mA = (o.sweep ?? 0) * Math.sin(Math.PI * ph) * o.globe;
      if (mA > 0.01) {
        const mLon = GLOBE.lon + GLOBE.drift * o.seconds + o.spin - 90 + 180 * ph;
        const coords: [number, number][] = [];
        for (let lat = -84; lat <= 84; lat += 6) coords.push([mLon, lat]);
        put(meridian.current, "d", path({ type: "LineString", coordinates: coords }) ?? "");
      }
      put(meridian.current, "stroke-opacity", String(r2(mA * 0.32)));

      // Rings: segments closing into continuous lines as they form, then —
      // down the page — tilting apart into two flattened, crossing orbits.
      const ro = lerp(GLOBE.ringOuter + 50, GLOBE.ringOuter, outQuart(o.rings));
      const ri = lerp(GLOBE.ringInner + 40, GLOBE.ringInner, outQuart(o.rings));
      put(ringOuter.current, "r", String(r1(ro)));
      put(ringInner.current, "r", String(r1(ri)));
      const ringA = String(r2(smooth(o.rings)));
      put(ringOuter.current, "stroke-opacity", ringA);
      put(ringInner.current, "stroke-opacity", ringA);
      const closed = smooth(clamp01((o.rings - 0.3) / 0.7));
      const dash = (r: number) => {
        if (closed >= 0.999) return "none";
        const L = (2 * Math.PI * r) / RING_SEGS;
        const on = L * lerp(0.28, 1, closed);
        return `${r1(on)} ${r1(L - on)}`;
      };
      put(ringOuter.current, "stroke-dasharray", dash(ro));
      put(ringInner.current, "stroke-dasharray", dash(ri));

      const frame = [
        { rot: 18 * flat, ky: 1 - 0.66 * flat, r: ro },
        { rot: -26 * flat, ky: 1 - 0.5 * flat, r: ri },
      ];
      put(ringOuter.current, "transform", flat > 0.001 ? `rotate(${r2(frame[0].rot)}) scale(1 ${r2(frame[0].ky)})` : "");
      put(ringInner.current, "transform", flat > 0.001 ? `rotate(${r2(frame[1].rot)}) scale(1 ${r2(frame[1].ky)})` : "");
      /** A point on ring k at angle a (radians), in that ring's current frame. */
      const on = (k: 0 | 1, a: number): [number, number] => {
        const f = frame[k];
        const x = Math.cos(a) * f.r;
        const y = Math.sin(a) * f.r * f.ky;
        const t = (f.rot * Math.PI) / 180;
        return [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)];
      };

      // The orbit dot travels counter-clockwise, ~10°/s, as in the reference,
      // and keeps riding its ring when the ring tilts away.
      const a = ((-37 - 10 * o.orbit) * Math.PI) / 180;
      const [ox, oy] = on(0, a);
      put(dotOuter.current, "cx", String(r1(ox)));
      put(dotOuter.current, "cy", String(r1(oy)));
      put(dotOuter.current, "fill-opacity", ringA);
      const [ix, iy] = on(1, a + 0.04);
      put(dotInner.current, "cx", String(r1(ix)));
      put(dotInner.current, "cy", String(r1(iy)));
      put(dotInner.current, "fill-opacity", String(r2(smooth(o.rings) * Math.max(1 - o.globe, 0.6 * flat))));

      // Orbit -> network: nodes on the rings, drawn together by chords.
      // The network lives on the rings, so it leaves with them.
      const netA = net * smooth(o.rings);
      put(netGroup.current, "opacity", String(r2(netA)));
      if (netA > 0.001) {
        const pts = NET.map((n) => on(n.ring, (n.a * Math.PI) / 180));
        let d = "";
        pts.forEach((p, i) => {
          const q = pts[(i + 1) % pts.length];
          d += `M${r1(p[0])} ${r1(p[1])}L${r1(q[0])} ${r1(q[1])}`;
        });
        NET.forEach((n, i) => { if (n.id) d += `M0 0L${r1(pts[i][0])} ${r1(pts[i][1])}`; });
        put(netPath.current, "d", d);
        put(netPath.current, "stroke-dashoffset", String(r2(1 - net)));
        netNodes.forEach((c, i) => {
          put(c, "cx", String(r1(pts[i][0])));
          put(c, "cy", String(r1(pts[i][1])));
        });
      }
    };
    const netNodes = [...svgEl.querySelectorAll<SVGCircleElement>(".about__node")];

    const applyStill = () => {
      const { sp, lp } = targets();
      const e1 = easeSecondary(sp);
      const e2 = easeSecondary(lp);
      place(e1);
      const q = (v: number) => Math.round(v * 40) / 40;
      pose({
        rings: 1, wire: 0, globe: 1, spin: 0, scale: 1, seconds: 0, orbit: 0,
        line: q(e1), flat: q(e1 * (1 - e2)), net: q(e2),
      });
    };

    // The page scrolls from the keyboard even while focus sits in the HUD
    // (the [About] pill that opened it). Inside the page the browser does it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close.current();
        return;
      }
      if (!el.hasAttribute("data-scroll") || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (sc.contains(target) || target.closest?.("input, textarea, select"))) return;
      const page = geo.vh * 0.85;
      const k = e.key;
      let dy = 0;
      if (k === "ArrowDown") dy = 80;
      else if (k === "ArrowUp") dy = -80;
      else if (k === "PageDown") dy = page;
      else if (k === "PageUp") dy = -page;
      else if (k === " " && !target?.closest?.("button, a")) dy = e.shiftKey ? -page : page;
      else if (k === "Home") dy = -sc.scrollTop;
      else if (k === "End") dy = sc.scrollHeight;
      if (!dy) return;
      e.preventDefault();
      sc.scrollBy({ top: dy, behavior: stillAtMount ? "auto" : "smooth" });
    };
    window.addEventListener("keydown", onKey);

    const cleanup = () => {
      glide?.cancel();
      grown.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      sc.removeEventListener("scroll", onScroll);
      seen.disconnect();
      flags.forEach((key) => {
        const [who, name] = key.split(":");
        (who === "s" ? stage : el).removeAttribute(name);
      });
    };

    // Reduced motion: final states, no frame loop. Scrolling still reshapes
    // the globe — directly, as the page moves, with no easing of its own.
    if (stillAtMount) {
      raise(el, "data-panels");
      raise(el, "data-scroll");
      onStillScroll = applyStill;
      void preloadGlobe().then((l) => {
        land = l;
        applyStill();
      });
      applyStill();
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
    // Scroll morph, eased toward its targets so the system glides rather
    // than tracking the wheel notch by notch.
    let sp = 0;
    let lp = 0;
    let phase = 0;
    // On the way out the globe glides back to the centre, where the sculpture
    // re-forms, but keeps the material it had: leaving from LINKS it spins
    // away as linework, rather than rewinding the page first.
    let matAtLeave: { line: number; flat: number; net: number } | null = null;

    // Leaving: the compositor hands the globe back to the frame loop exactly
    // where it stands (called before the page is cut back to its top).
    handoff.current = () => {
      if (!glide) return;
      const cs = getComputedStyle(svgEl);
      svgEl.style.transform = cs.transform;
      svgEl.style.opacity = cs.opacity;
      lastPlace = "";
      glide.cancel();
      glide = null;
      sp = targets().sp;
    };

    const scrollMorph = (dt: number) => {
      const tg = targets();
      const k = 1 - Math.exp(-dt / 160);
      sp += (tg.sp - sp) * k;
      lp += (tg.lp - lp) * k;
      if (Math.abs(tg.sp - sp) < 0.0005) sp = tg.sp;
      if (Math.abs(tg.lp - lp) < 0.0005) lp = tg.lp;
      const e1 = easeSecondary(sp);
      const e2 = easeSecondary(lp);
      place(e1);

      // The system changes state audibly, once per change, with hysteresis
      // so a page resting on a threshold stays quiet.
      const next = lp > 0.6 ? 2 : lp < 0.4 && sp > 0.55 ? 1 : sp < 0.45 && lp < 0.4 ? 0 : phase;
      if (next !== phase) {
        if (leftAt === null && arrived) cue(next === 2 ? "align" : "row");
        phase = next;
      }
      // Quantized: each change repaints the coastline, so mid-scroll it
      // changes in 40 steps rather than every frame.
      const q = (v: number) => Math.round(v * 40) / 40;
      const mat = { line: q(e1), flat: q(e1 * (1 - e2)), net: q(e2) };
      if (leftAt === null) return mat;
      matAtLeave ??= mat;
      return matAtLeave;
    };

    const frame = (now: number, dt: number) => {
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
          measure();
          raise(el, "data-scroll");
          bindGlide();
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
          sweep: smooth(seg(t, ABOUT_IN.end, ABOUT_IN.end + 1.2)),
          ...scrollMorph(dt),
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
        ...scrollMorph(dt),
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
      <svg ref={globeSvg} className="about__globe" aria-hidden="true">
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

        <g fill="none" stroke="#8b8b8b" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
          <circle ref={ringOuter} r={GLOBE.ringOuter} strokeOpacity="0" vectorEffect="non-scaling-stroke" />
          <circle ref={ringInner} r={GLOBE.ringInner} strokeOpacity="0" vectorEffect="non-scaling-stroke" />
        </g>
        <circle ref={dotOuter} r="9" fill="#8a8a8a" fillOpacity="0" />
        <circle ref={dotInner} r="5" fill="#6e6e6e" fillOpacity="0" />

        <g ref={globeGroup} opacity="0">
          <circle ref={ocean} r={GLOBE.r} fill="url(#about-ocean)" />
          <path ref={landPath} fill="url(#about-land)" fillOpacity="0" stroke="#55555a" strokeWidth="0.8" strokeOpacity="0" strokeLinejoin="round" />
          <circle ref={limb} r={GLOBE.r} fill="url(#about-limb)" />
          <path ref={gratPath} fill="none" stroke="#8d8d8d" strokeWidth="0.6" strokeOpacity="0" />
          <path ref={meridian} fill="none" stroke="#3c3c40" strokeWidth="1.1" strokeOpacity="0" strokeLinecap="round" />
          <circle ref={outline} r={GLOBE.r} fill="none" stroke="#8b8b8b" strokeWidth="1" strokeOpacity="0" />
          <g fill="none" stroke="#ffffff" strokeOpacity="0.28">
            <circle r="150" strokeWidth="4" />
            <circle r="46" strokeWidth="2" />
          </g>
        </g>

        <g ref={netGroup} className="about__net" opacity="0">
          <path ref={netPath} fill="none" stroke="#6e6e72" strokeWidth="0.9" pathLength={1} strokeDasharray="1 1" strokeDashoffset="1" />
          {NET.map((n, i) => (
            <circle
              key={i}
              className="about__node"
              data-node={n.id ?? undefined}
              r={n.id ? 7 : 4.5}
              fill={n.id ? "#3a3a3d" : "#9a9a9e"}
            />
          ))}
        </g>
      </svg>

      <div className="about__labels" aria-hidden="true">
        <p className="about__label" data-label="route">{ABOUT_LABELS.route}</p>
        <p className="about__label" data-label="handshake">{ABOUT_LABELS.handshake}</p>
        <p className="about__label" data-label="online">{ABOUT_LABELS.online}</p>
      </div>

      <div ref={scroller} className="about__scroll" tabIndex={-1}>
        <div className="about__hero">
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

          <p className="about__cue" aria-hidden="true">
            <span>Scroll</span>
            <i />
            <span>Profile continues</span>
          </p>
        </div>

        <div className="about__more">
          <div ref={column} className="about__col">
            <section className="about__sec" data-sec aria-labelledby="about-trajectory">
              <p className="about__eyebrow">{"// 02 · Trajectory"}</p>
              <h2 id="about-trajectory" className="about__h2">{PROFILE.trajectory.heading}</h2>
              <ol className="about__rows">
                {PROFILE.trajectory.rows.map((r, i) => (
                  <li key={r.label} style={{ ["--i" as string]: i }}>
                    <span className="about__rowlabel">{r.label}</span>
                    <p>{r.text}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="about__sec" data-sec aria-labelledby="about-disciplines">
              <p className="about__eyebrow">{"// 03 · Disciplines"}</p>
              <h2 id="about-disciplines" className="about__h2">{PROFILE.disciplines.heading}</h2>
              <ul className="about__list">
                {PROFILE.disciplines.items.map((d, i) => (
                  <li key={d} style={{ ["--i" as string]: i }}>
                    <span className="about__idx">{String(i + 1).padStart(2, "0")}</span>
                    {d}
                  </li>
                ))}
              </ul>
            </section>

            <section className="about__sec" data-sec aria-labelledby="about-method">
              <p className="about__eyebrow">{"// 04 · Method"}</p>
              <h2 id="about-method" className="about__h2">{PROFILE.method.heading}</h2>
              <ol className="about__method">
                {PROFILE.method.steps.map((m, i) => (
                  <li key={m.label} style={{ ["--i" as string]: i }}>
                    <span className="about__idx">{String(i + 1).padStart(2, "0")}</span>
                    <span className="about__steplabel">{m.label}</span>
                    <p>{m.text}</p>
                  </li>
                ))}
              </ol>
            </section>

            {PROFILE.tools.length > 0 ? (
              <section className="about__sec" data-sec aria-labelledby="about-tools">
                <p className="about__eyebrow">{"// 05 · Tools"}</p>
                <h2 id="about-tools" className="about__h2">Selected tools.</h2>
                <ul className="about__tools">
                  {PROFILE.tools.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </section>
            ) : null}

            <section ref={linksSec} className="about__sec about__sec--links" data-sec aria-labelledby="about-links">
              <article className="about__panel about__panel--links">
                <Corners />
                <div className="about__inner">
                  <div className="about__linkshead">
                    <h2 id="about-links" className="about__eyebrow">
                      <span aria-hidden="true">{`// ${String(PROFILE.tools.length > 0 ? 6 : 5).padStart(2, "0")} · `}</span>
                      Links
                    </h2>
                    <p className="about__eyebrow about__eyebrow--quiet" aria-hidden="true">External channels · {SOCIALS.length} open</p>
                  </div>
                  <ul className="about__links">
                    {SOCIALS.map((l, i) => (
                      <li key={l.id}>
                        <a
                          className="about__link"
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onPointerEnter={(e) => {
                            if (e.pointerType === "mouse") cue("hover");
                            hot.current(l.id);
                          }}
                          onPointerLeave={() => hot.current(null)}
                          onFocus={() => hot.current(l.id)}
                          onBlur={() => hot.current(null)}
                          onClick={() => cue("select")}
                        >
                          <span className="about__idx">{String(i + 1).padStart(2, "0")}</span>
                          <span className="about__linklabel">{l.label}</span>
                          <span className="about__linkhandle">{l.handle}</span>
                          <ArrowUpRight className="about__linkarrow" size={13} strokeWidth={1.5} aria-hidden="true" />
                          <span className="about__sr">(opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </section>

            <footer className="about__eof">
              <span>{"// EOF · Profile_Node"}</span>
              <button
                type="button"
                className="about__top"
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") cue("hover");
                }}
                onClick={() => {
                  cue("select");
                  scroller.current?.scrollTo({ top: 0, behavior: stillAtMount ? "auto" : "smooth" });
                }}
              >
                [Top ↑]
              </button>
            </footer>
          </div>
        </div>
      </div>
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
