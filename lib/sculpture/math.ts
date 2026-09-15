/**
 * Minimal 3D math for the sculpture. Plain tuples and 3x3 matrices — there is
 * no scene graph, no library, and nothing here allocates per vertex.
 */
export type V3 = [number, number, number];
/** Quaternion, [x, y, z, w]. */
export type Q = [number, number, number, number];
/** Row-major 3x3 rotation matrix. */
export type M3 = Float64Array;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
/** Smootherstep: zero velocity AND zero acceleration at both ends, and a
 *  gentler peak speed than a cubic in-out — no jerk as a move starts or lands. */
export const inOut = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
/** Ease-out with a soft landing (quintic tail, eased start). */
export const outQuart = (t: number) => {
  const s = t * t * (3 - 2 * t);
  return 1 - Math.pow(1 - s, 3);
};
export const deg = (d: number) => (d * Math.PI) / 180;

export const vLerp = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
export const vSub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const vCross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const vDot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const vNorm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export const Q_ID: Q = [0, 0, 0, 1];

export function qAxis(x: number, y: number, z: number, angle: number): Q {
  const l = Math.hypot(x, y, z) || 1;
  const s = Math.sin(angle / 2) / l;
  return [x * s, y * s, z * s, Math.cos(angle / 2)];
}

/** a * b — applies b first, then a. */
export function qMul(a: Q, b: Q): Q {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

/** Rotate about X, then Y, then Z (intrinsic order used everywhere here). */
export function qEuler(x: number, y: number, z: number): Q {
  return qMul(qAxis(0, 0, 1, z), qMul(qAxis(0, 1, 0, y), qAxis(1, 0, 0, x)));
}

export function qSlerp(a: Q, b: Q, t: number): Q {
  let [bx, by, bz, bw] = b;
  let cos = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  if (cos < 0) {
    cos = -cos;
    bx = -bx; by = -by; bz = -bz; bw = -bw;
  }
  let k0 = 1 - t;
  let k1 = t;
  if (cos < 0.9995) {
    const th = Math.acos(cos);
    const s = Math.sin(th);
    k0 = Math.sin((1 - t) * th) / s;
    k1 = Math.sin(t * th) / s;
  }
  const out: Q = [a[0] * k0 + bx * k1, a[1] * k0 + by * k1, a[2] * k0 + bz * k1, a[3] * k0 + bw * k1];
  const l = Math.hypot(out[0], out[1], out[2], out[3]) || 1;
  return [out[0] / l, out[1] / l, out[2] / l, out[3] / l];
}

export function qToM3(q: Q, out: M3 = new Float64Array(9)): M3 {
  const [x, y, z, w] = q;
  out[0] = 1 - 2 * (y * y + z * z); out[1] = 2 * (x * y - z * w);     out[2] = 2 * (x * z + y * w);
  out[3] = 2 * (x * y + z * w);     out[4] = 1 - 2 * (x * x + z * z); out[5] = 2 * (y * z - x * w);
  out[6] = 2 * (x * z - y * w);     out[7] = 2 * (y * z + x * w);     out[8] = 1 - 2 * (x * x + y * y);
  return out;
}

/** Rotation matrix whose columns are the given orthonormal axes. */
export function qFromAxes(xa: V3, ya: V3, za: V3): Q {
  const m00 = xa[0], m01 = ya[0], m02 = za[0];
  const m10 = xa[1], m11 = ya[1], m12 = za[1];
  const m20 = xa[2], m21 = ya[2], m22 = za[2];
  const tr = m00 + m11 + m22;
  let q: Q;
  if (tr > 0) {
    const s = 0.5 / Math.sqrt(tr + 1);
    q = [(m21 - m12) * s, (m02 - m20) * s, (m10 - m01) * s, 0.25 / s];
  } else if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22);
    q = [0.25 * s, (m10 + m01) / s, (m02 + m20) / s, (m21 - m12) / s];
  } else if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22);
    q = [(m10 + m01) / s, 0.25 * s, (m21 + m12) / s, (m02 - m20) / s];
  } else {
    const s = 2 * Math.sqrt(1 + m22 - m00 - m11);
    q = [(m02 + m20) / s, (m21 + m12) / s, 0.25 * s, (m10 - m01) / s];
  }
  const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
}

export function m3Apply(m: M3, v: V3): V3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/** Deterministic pseudo-random, so the composition is identical every visit. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
