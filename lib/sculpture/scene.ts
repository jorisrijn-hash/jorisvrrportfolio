import { IDLE_LOOP, XFER } from "@/content/transition";
import {
  type M3, type Q, type V3,
  Q_ID, clamp01, deg, inOut, lerp, m3Apply, qAxis, qEuler, qFromAxes, qMul, qSlerp, qToM3,
  rng, seg, smooth, vCross, vDot, vLerp, vNorm, vSub,
} from "./math";

/**
 * THE SCULPTURE — the loading object, rebuilt as the home composition.
 *
 * No WebGL, no canvas. Geometry is evaluated here in plain JS, projected with
 * a single perspective camera, and handed back as SVG path data sorted back to
 * front. Every object is convex, so back-face culling plus a per-object depth
 * sort is enough to draw it correctly.
 *
 * Every home object BEGINS as a part of the centre construction
 * (CenterDiagram.tsx), at that part's exact measured geometry:
 *
 *   ring r119          -> the core: circle morphs to an octagon and fills
 *   diamond            -> an octahedron (its equator IS the diamond), whose
 *                         8 faces split away as 8 tetrahedra
 *   triangle           -> the lead tetrahedron (its base IS the triangle)
 *   apex mark          -> a small tetrahedral fragment
 *   dashed ring r153   -> 68 dashes, each a 5x1x1 box, become the cube ring
 *   outer ring r179    -> tilts and grows into the far orbit of cubes
 *   4 ticks            -> 4 flattened boxes that inflate into medium cubes
 *   stem               -> an axis that extends and dissolves
 *
 * So at t = 0 the projection draws the construction pixel for pixel, and
 * nothing is ever swapped: the same vertices carry through to home.
 */

/** Focal length, which is also the camera's distance from the z = 0 plane. */
const F = 1600;
/** Direction TOWARD the light: up, left, in front. */
const LIGHT = vNorm([-0.45, -0.75, -0.55]);
/** The home ground tone that distant geometry fades into. */
const FOG_TONE = 226;

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ meshes */

type Mesh = { verts: V3[]; faces: number[][] };

const centroid = (vs: V3[]): V3 => {
  const c: V3 = [0, 0, 0];
  vs.forEach((v) => { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; });
  return [c[0] / vs.length, c[1] / vs.length, c[2] / vs.length];
};

/** Wind every face outward, so culling can rely on the sign of its normal. */
function orient(verts: V3[], faces: number[][]): number[][] {
  const c = centroid(verts);
  return faces.map((f) => {
    const n = vCross(vSub(verts[f[1]], verts[f[0]]), vSub(verts[f[2]], verts[f[0]]));
    const fc = centroid(f.map((i) => verts[i]));
    return vDot(n, vSub(fc, c)) >= 0 ? f : [...f].reverse();
  });
}

const TETRA_H = Math.sqrt(2 / 3);
/** Unit-edge tetrahedron. Base centred on the origin in z = 0, apex on +z. */
const TETRA: Mesh = (() => {
  const verts: V3[] = [
    [0, -1 / Math.sqrt(3), 0],
    [0.5, 0.5 / Math.sqrt(3), 0],
    [-0.5, 0.5 / Math.sqrt(3), 0],
    [0, 0, TETRA_H],
  ];
  return { verts, faces: orient(verts, [[0, 1, 2], [0, 1, 3], [1, 2, 3], [2, 0, 3]]) };
})();
const TETRA_BASE = TETRA.faces.findIndex((f) => !f.includes(3));
// Scale z so that sz = edge gives a regular tetrahedron.
TETRA.verts[3] = [0, 0, 1 * TETRA_H];

const CUBE: Mesh = (() => {
  const verts: V3[] = [];
  for (let i = 0; i < 8; i++) verts.push([(i & 1) - 0.5, ((i >> 1) & 1) - 0.5, ((i >> 2) & 1) - 0.5]);
  return {
    verts,
    faces: orient(verts, [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]),
  };
})();

/* ------------------------------------------------------------ measurements */

// CenterDiagram.tsx, in the same units (1px at z = 0).
const R_RING = 119;
const R_DASH = 153;
const R_OUTER = 179;

const OCTA_R = R_RING;
const OCTA_TILT = qEuler(deg(28), deg(38), deg(8));
const OCTA_FACES = orient(
  [[0, -1, 0], [1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, 0, -1], [0, 0, 1]],
  [0, 1, 2, 3].flatMap((i) => [[i, (i + 1) % 4, 4], [i, (i + 1) % 4, 5]]),
);

function octaVerts(depth: number): V3[] {
  const z = OCTA_R * Math.max(depth, 0.004);
  return [[0, -OCTA_R, 0], [OCTA_R, 0, 0], [0, OCTA_R, 0], [-OCTA_R, 0, 0], [0, 0, -z], [0, 0, z]];
}

// Home positions, read off the reference's settled frame (ruler at 16.9s) and
// expressed relative to the viewport centre.
const TETRA_HOMES: { h: V3; s: number; spin: V3 }[] = [
  { h: [-15, -110, -90], s: 185, spin: [40, -30, 20] },
  { h: [-205, 110, -30], s: 160, spin: [-50, 40, 10] },
  { h: [245, 40, 70], s: 125, spin: [30, 60, -20] },
  { h: [80, -250, 90], s: 105, spin: [-35, -50, 30] },
  { h: [-10, 120, -140], s: 130, spin: [55, 20, -40] },
  { h: [160, 150, -70], s: 110, spin: [-25, -60, 15] },
  { h: [-165, -70, 130], s: 95, spin: [45, 35, 50] },
  { h: [55, 265, 40], s: 85, spin: [-40, 50, -25] },
];

const MEDIUM_HOMES: { h: V3; s: number }[] = [
  { h: [-40, -335, -20], s: 64 },
  { h: [0, -228, 10], s: 72 },
  { h: [72, 12, -110], s: 78 },
  { h: [108, 135, -40], s: 72 },
  { h: [135, 255, -70], s: 78 },
  { h: [150, 360, -100], s: 66 },
];

const RING_COUNT = 68;         // 961px circumference / (5 + 9) dash period
const RING_R = 520;
const RING_C: V3 = [-120, 0, 200];
const RING_Q = qMul(qAxis(0, 0, 1, deg(-6)), qAxis(0, 1, 0, deg(52)));
const RING_CUBE = 26;

const ORBIT_COUNT = 48;
const ORBIT_R = 1000;
const ORBIT_C: V3 = [40, -20, 500];
const ORBIT_Q = qMul(qAxis(0, 0, 1, deg(8)), qAxis(1, 0, 0, deg(-72)));
const ORBIT_CUBE = 16;

/* ---------------------------------------------------------------- the build */

type TetraPart = {
  start: { p: V3; q: Q; s: V3 };
  home: { p: V3; q: Q; s: number };
  /** delay into the split, seconds */
  delay: number;
  g0: number; fa0: number; sa0: number;
  wobble: { a: number; b: number; n: number; m: number; bob: number };
};

type CubePart = {
  start: { p: V3; q: Q; s: V3 };
  home: { p: V3; q: Q; s: number };
  delay: number;
};

function buildTetras(): TetraPart[] {
  const rand = rng(1955);
  const verts = octaVerts(1).map((v) => m3Apply(qToM3(OCTA_TILT), v));

  const faces = OCTA_FACES.map((f) => {
    const [a, b, c] = f.map((i) => verts[i]);
    const cen = centroid([a, b, c]);
    const za = vNorm(vCross(vSub(b, a), vSub(c, a)));
    const ya = vNorm(vSub(cen, a));
    const xa = vCross(ya, za);
    return { cen, q: qFromAxes(xa, ya, za), edge: Math.hypot(...vSub(b, a)) };
  });

  // Send each face to the nearest free home, so fragments fly outward instead
  // of crossing through each other.
  const free = faces.map((_, i) => i);
  const parts: TetraPart[] = TETRA_HOMES.map((home, k) => {
    let best = 0;
    let bestD = Infinity;
    free.forEach((fi, j) => {
      const d = Math.hypot(faces[fi].cen[0] - home.h[0] * 0.4, faces[fi].cen[1] - home.h[1] * 0.4);
      if (d < bestD) { bestD = d; best = j; }
    });
    const face = faces[free.splice(best, 1)[0]];
    const spin = qEuler(deg(home.spin[0]), deg(home.spin[1]), deg(home.spin[2]));
    return {
      start: { p: face.cen, q: face.q, s: [face.edge, face.edge, 0.7] },
      home: { p: home.h, q: qMul(spin, face.q), s: home.s },
      delay: k * 0.035,
      g0: 216, fa0: 1, sa0: 0,
      wobble: wob(rand),
    };
  });

  // The triangle: canonical base (0,-.577)(.5,.289)(-.5,.289) mapped onto
  // (0,-62)(86,46)(-86,46). Its base face is stroked, so at t = 0 it IS the
  // drawn triangle.
  const lead: TetraPart = {
    start: { p: [0, 46 - (0.5 / Math.sqrt(3)) * (108 / (Math.sqrt(3) / 2)), 0], q: Q_ID, s: [172, 108 / (Math.sqrt(3) / 2), 0.7] },
    home: { p: [-125, -285, -40], q: qEuler(deg(-20), deg(30), deg(-10)), s: 150 },
    delay: 0.02,
    g0: 216, fa0: 0, sa0: 1,
    wobble: wob(rand),
  };

  // The apex mark: (0,-65)(20,3)(-20,3), filled.
  const sy = 68 / (Math.sqrt(3) / 2);
  const frag: TetraPart = {
    start: { p: [0, 3 - (0.5 / Math.sqrt(3)) * sy, -1], q: Q_ID, s: [40, sy, 0.7] },
    home: { p: [-310, -40, 60], q: qEuler(deg(30), deg(-40), deg(20)), s: 62 },
    delay: 0.1,
    g0: 229, fa0: 1, sa0: 0,
    wobble: wob(rand),
  };

  return [...parts, lead, frag];
}

function wob(rand: () => number) {
  const sign = () => (rand() > 0.5 ? 1 : -1);
  return {
    a: deg(8 + rand() * 14) * sign(),
    b: deg(8 + rand() * 14) * sign(),
    n: rand() > 0.5 ? 1 : 2,
    m: rand() > 0.5 ? 1 : 2,
    bob: (4 + rand() * 6) * sign(),
  };
}

function buildMedium(): CubePart[] {
  const rand = rng(88);
  const ticks: { p: V3; s: V3 }[] = [
    { p: [0, -139, 0], s: [1.6, 22, 1.6] },
    { p: [0, 139, 0], s: [1.6, 22, 1.6] },
    { p: [-139, 0, 0], s: [22, 1.6, 1.6] },
    { p: [139, 0, 0], s: [22, 1.6, 1.6] },
    // two more grow out of the core itself
    { p: [0, 0, 0], s: [0.01, 0.01, 0.01] },
    { p: [0, 0, 0], s: [0.01, 0.01, 0.01] },
  ];
  const free = MEDIUM_HOMES.map((_, i) => i);
  return ticks.map((tick, k) => {
    let best = 0;
    let bestD = Infinity;
    free.forEach((hi, j) => {
      const h = MEDIUM_HOMES[hi].h;
      const d = Math.hypot(h[0] - tick.p[0], h[1] - tick.p[1]);
      if (d < bestD) { bestD = d; best = j; }
    });
    const home = MEDIUM_HOMES[free.splice(best, 1)[0]];
    return {
      start: { p: tick.p, q: Q_ID, s: tick.s },
      home: {
        p: home.h,
        q: qEuler(deg((rand() - 0.5) * 50), deg((rand() - 0.5) * 60), deg((rand() - 0.5) * 30)),
        s: home.s,
      },
      delay: k * 0.05,
    };
  });
}

type Links = { pts: V3[]; pairs: [number, number][] };

function buildLinks(): Links {
  const rand = rng(470);
  const pts: V3[] = [];
  for (let i = 0; i < 11; i++) {
    pts.push([(rand() - 0.5) * 1300, (rand() - 0.5) * 760, -200 + rand() * 800]);
  }
  const pairs: [number, number][] = [[0, 3], [1, 4], [2, 5], [3, 7], [5, 8], [6, 9], [8, 10], [4, 6]];
  return { pts, pairs };
}

/* ------------------------------------------------------------ frame output */

export type DrawFace = { z: number; d: string; g: number; fa: number; sa: number };

export type Frame = {
  opacity: number;
  faces: DrawFace[];
  orbit: string; orbitA: number;
  stem: string; stemA: number;
  links: string; dots: string; linkA: number;
};

export type Pose = {
  /** transition time in seconds; >= XFER.end is home */
  t: number;
  /** position in the idle loop, seconds in [0, IDLE_LOOP) */
  loop: number;
  /** cursor influence, radians */
  tiltX: number;
  tiltY: number;
  /** viewport fit — 1 at the 1920x950 reference */
  fit: number;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export function createScene() {
  const tetras = buildTetras();
  const medium = buildMedium();
  const links = buildLinks();

  const ringStart = Array.from({ length: RING_COUNT }, (_, i) => (2.5 + 14 * i) / R_DASH);
  const ringHome = ringStart.map((_, i) => ringStart[0] + (TAU * i) / RING_COUNT);

  const tmpM = new Float64Array(9) as M3;
  const objM = new Float64Array(9) as M3;

  return function evaluate(pose: Pose): Frame {
    const { t, loop } = pose;
    const faces: DrawFace[] = [];

    // ---- phases -----------------------------------------------------------
    const lock = seg(t, XFER.lock[0], XFER.lock[1]);
    const transform = inOut(seg(t, XFER.transform[0], XFER.transform[1]));
    const expand = inOut(seg(t, XFER.expand[0], XFER.expand[1]));

    const k = lerp(1, pose.fit, expand) * (1 - 0.035 * Math.sin(Math.PI * lock));

    // ---- idle (every term is periodic in IDLE_LOOP and zero at loop = 0) --
    const w = (loop / IDLE_LOOP) * TAU;
    const tilt = qEuler(pose.tiltX, pose.tiltY, 0);
    const cluster = qToM3(qMul(tilt, qEuler(deg(5) * Math.sin(2 * w), deg(16) * Math.sin(w), 0)));
    const secondary = qToM3(tilt);

    const project = (p: V3): [number, number] => {
      const s = (F / Math.max(80, F + p[2])) * k;
      return [p[0] * s, p[1] * s];
    };

    const shade = (n: V3) => {
      const nn = vNorm(n);
      const lam = Math.max(0, vDot(nn, LIGHT));
      return 186 + 58 * lam + 8 * Math.max(0, -nn[2]);
    };

    /** Transform, cull, shade and emit one convex mesh. */
    const emit = (
      mesh: Mesh, p: V3, q: Q, s: V3, group: M3,
      style: { g0: number; m: number; fa: number; sa: number; strokeFace: number; bias?: number },
    ) => {
      qToM3(q, objM);
      const W = mesh.verts.map((v) => {
        const r = m3Apply(objM, [v[0] * s[0], v[1] * s[1], v[2] * s[2]]);
        return m3Apply(group, [r[0] + p[0], r[1] + p[1], r[2] + p[2]]);
      });
      let zc = 0;
      W.forEach((v) => { zc += v[2]; });
      zc /= W.length;

      const fog = clamp01((zc - 150) / 1500) * 0.7 * style.m;
      const near = clamp01((-zc - 350) / 600) * 0.5 * style.m;

      mesh.faces.forEach((f, i) => {
        const a = W[f[0]];
        const n = vCross(vSub(W[f[1]], a), vSub(W[f[2]], a));
        // Visible when the outward normal points back toward the camera.
        if (vDot(n, [a[0], a[1], a[2] + F]) >= 0) return;

        let g = lerp(style.g0, shade(n), style.m);
        g = lerp(g, FOG_TONE, fog);
        let d = "";
        f.forEach((vi, j) => {
          const [x, y] = project(W[vi]);
          d += (j ? "L" : "M") + r1(x) + " " + r1(y);
        });
        faces.push({
          z: zc + (style.bias ?? 0),
          d: d + "Z",
          g,
          fa: style.fa * (1 - fog * 0.55) * (1 - near),
          sa: style.strokeFace === -1 || style.strokeFace === i ? style.sa : 0,
        });
      });
    };

    // ---- core: ring r119 -> octagon ---------------------------------------
    {
      const breathe = 1 + 0.03 * Math.sin(2 * w);
      const radius = lerp(R_RING, 88, expand) * breathe;
      const centre = m3Apply(cluster, [0, 0, lerp(0, 30, expand)]);
      const [cx, cy] = project(centre);
      const scale = (F / Math.max(80, F + centre[2])) * k;
      let d = "";
      for (let i = 0; i < 64; i++) {
        const th = (TAU * i) / 64;
        // octagon with flat edges top and bottom
        const local = (((th + Math.PI / 8) % (Math.PI / 4)) + Math.PI / 4) % (Math.PI / 4);
        const oct = Math.cos(Math.PI / 8) / Math.cos(local - Math.PI / 8);
        const r = radius * lerp(1, oct, transform) * scale;
        d += (i ? "L" : "M") + r1(cx + r * Math.cos(th)) + " " + r1(cy + r * Math.sin(th));
      }
      faces.push({ z: centre[2] + 4, d: d + "Z", g: 251, fa: expand * 0.96, sa: 1 - expand });
    }

    // ---- diamond -> octahedron -> tetrahedra -------------------------------
    if (t < XFER.split) {
      const q = qSlerp(Q_ID, OCTA_TILT, transform);
      emit({ verts: octaVerts(transform), faces: OCTA_FACES }, [0, 0, 0], q, [1, 1, 1], cluster, {
        g0: 216, m: transform, fa: transform, sa: 0, strokeFace: -2,
      });
      // The equator of the octahedron is the diamond — drawn as its outline
      // while the faces are still transparent.
      qToM3(q, tmpM);
      let d = "";
      octaVerts(transform).slice(0, 4).forEach((v, i) => {
        const [x, y] = project(m3Apply(cluster, m3Apply(tmpM, v)));
        d += (i ? "L" : "M") + r1(x) + " " + r1(y);
      });
      faces.push({ z: -200, d: d + "Z", g: 216, fa: 0, sa: 1 - transform });
    }

    tetras.forEach((part, idx) => {
      const isOcta = idx < TETRA_HOMES.length;
      if (isOcta && t < XFER.split) return;
      const base = isOcta ? XFER.split : XFER.expand[0];
      const c = inOut(seg(t, base + part.delay, base + part.delay + XFER.splitDur));

      // Fly out along a swirl rather than a straight line.
      const swirl = qToM3(qAxis(0, 1, 0, deg(-35) * (1 - c)), tmpM);
      const target = m3Apply(swirl, part.home.p);
      const out = vNorm([part.home.p[0], part.home.p[1], 0]);
      const arc = Math.sin(Math.PI * c) * 70;

      const wb = part.wobble;
      const bob = wb.bob * Math.sin(wb.n * w);
      const p = vLerp(part.start.p, target, c);
      p[0] += out[0] * arc;
      p[1] += out[1] * arc + bob;

      const q = qMul(
        qEuler(wb.a * Math.sin(wb.n * w), wb.b * Math.sin(wb.m * w), 0),
        qSlerp(part.start.q, part.home.q, c),
      );
      const hs = part.home.s;
      const s: V3 = [lerp(part.start.s[0], hs, c), lerp(part.start.s[1], hs, c), lerp(part.start.s[2], hs, c)];

      emit(TETRA, p, q, s, cluster, {
        g0: part.g0,
        m: c,
        fa: lerp(part.fa0, 1, smooth(clamp01(c * 1.6))),
        sa: part.sa0 * (1 - c),
        strokeFace: TETRA_BASE,
        bias: idx === TETRA_HOMES.length + 1 ? -2 : 0,
      });
    });

    // ---- ticks -> medium cubes --------------------------------------------
    medium.forEach((part) => {
      const c = inOut(seg(t, XFER.expand[0] + part.delay, XFER.expand[1] + part.delay));
      const hs = part.home.s;
      const s: V3 = [lerp(part.start.s[0], hs, c), lerp(part.start.s[1], hs, c), lerp(part.start.s[2], hs, c)];
      const p = vLerp(part.start.p, part.home.p, c);
      // offset so the bob is exactly zero at loop = 0 — no jump on arrival
      p[1] += 5 * (Math.sin(w + part.delay * 20) - Math.sin(part.delay * 20));
      emit(CUBE, p, qSlerp(Q_ID, part.home.q, c), s, cluster, { g0: 216, m: c, fa: 1, sa: 0, strokeFace: -2 });
    });

    // ---- dashed ring -> cube ring -----------------------------------------
    // Drifts exactly two element spacings per loop, so the loop seam is
    // invisible: at the wrap every cube stands where its neighbour was.
    const ringDrift = ((2 * TAU) / RING_COUNT) * (loop / IDLE_LOOP);
    for (let i = 0; i < RING_COUNT; i++) {
      const c = inOut(seg(t, XFER.expand[0] + 0.18 * (i / RING_COUNT), XFER.expand[1] + 0.18 * (i / RING_COUNT)));
      const angle = lerp(ringStart[i], ringHome[i], c) + ringDrift * c;
      const r = lerp(R_DASH, RING_R, c);
      const plane = qSlerp(Q_ID, RING_Q, c);
      const local = m3Apply(qToM3(plane, tmpM), [r * Math.cos(angle), r * Math.sin(angle), 0]);
      const centre = vLerp([0, 0, 0], RING_C, c);
      const p: V3 = [local[0] + centre[0], local[1] + centre[1], local[2] + centre[2]];
      const q = qMul(plane, qAxis(0, 0, 1, angle + Math.PI / 2));
      const s: V3 = [lerp(5, RING_CUBE, c), lerp(1, RING_CUBE, c), lerp(1, RING_CUBE, c)];
      emit(CUBE, p, q, s, secondary, { g0: 216, m: c, fa: 1, sa: 0, strokeFace: -2 });
    }

    // ---- outer ring -> far orbit ------------------------------------------
    const orbitDrift = (TAU / ORBIT_COUNT) * (loop / IDLE_LOOP);
    const orbitAt = (c: number, angle: number): V3 => {
      const r = lerp(R_OUTER, ORBIT_R, c);
      const local = m3Apply(qToM3(qSlerp(Q_ID, ORBIT_Q, c), tmpM), [r * Math.cos(angle), r * Math.sin(angle), 0]);
      const centre = vLerp([0, 0, 0], ORBIT_C, c);
      return m3Apply(secondary, [local[0] + centre[0], local[1] + centre[1], local[2] + centre[2]]);
    };
    for (let j = 0; j < ORBIT_COUNT; j++) {
      const c = inOut(seg(t, 1.2 + 0.15 * (j / ORBIT_COUNT), 2.1 + 0.15 * (j / ORBIT_COUNT)));
      if (c <= 0) continue;
      const angle = (TAU * j) / ORBIT_COUNT + orbitDrift;
      const r = lerp(R_OUTER, ORBIT_R, c);
      const plane = qSlerp(Q_ID, ORBIT_Q, c);
      const local = m3Apply(qToM3(plane, tmpM), [r * Math.cos(angle), r * Math.sin(angle), 0]);
      const centre = vLerp([0, 0, 0], ORBIT_C, c);
      const p: V3 = [local[0] + centre[0], local[1] + centre[1], local[2] + centre[2]];
      const q = qMul(plane, qAxis(0, 0, 1, angle));
      const sz = lerp(0.01, ORBIT_CUBE, c);
      emit(CUBE, p, q, [sz, sz, sz], secondary, { g0: 221, m: c, fa: lerp(0.28, 1, c), sa: 0, strokeFace: -2 });
    }
    const orbitC = inOut(seg(t, 1.2, 2.1));
    let orbit = "";
    if (orbitC < 1) {
      for (let i = 0; i <= 96; i++) {
        const [x, y] = project(orbitAt(orbitC, (TAU * i) / 96));
        orbit += (i ? "L" : "M") + r1(x) + " " + r1(y);
      }
    }

    // ---- stem -> axis ------------------------------------------------------
    const stemLen = lerp(30, 640, expand);
    const [sx1, sy1] = project(m3Apply(cluster, [0, -stemLen, 0]));
    const [sx2, sy2] = project(m3Apply(cluster, [0, stemLen, 0]));
    const stem = `M${r1(sx1)} ${r1(sy1)}L${r1(sx2)} ${r1(sy2)}`;

    // ---- faint links and nodes --------------------------------------------
    const linkA = 0.5 * smooth(seg(t, XFER.bloom, XFER.bloom + 0.7));
    let linkPath = "";
    let dots = "";
    if (linkA > 0) {
      const P = links.pts.map((pt) => project(m3Apply(cluster, vLerp([0, 0, 0], pt, expand))));
      links.pairs.forEach(([a, b]) => {
        linkPath += `M${r1(P[a][0])} ${r1(P[a][1])}L${r1(P[b][0])} ${r1(P[b][1])}`;
      });
      P.forEach(([x, y], i) => {
        const r = i % 3 === 0 ? 3.2 : 2;
        dots += `M${r1(x - r)} ${r1(y)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
      });
    }

    // Far first. Array.sort is stable, so an object's faces stay together.
    faces.sort((a, b) => b.z - a.z);

    return {
      opacity: smooth(seg(t, XFER.resolve[0], XFER.resolve[1])),
      faces,
      orbit, orbitA: 0.28 * (1 - orbitC),
      stem, stemA: 1 - seg(t, 1.3, 2.1),
      links: linkPath, dots, linkA,
    };
  };
}
