import fs from "fs";
import { geoArea } from "d3-geo";
import { feature } from "topojson-client";

/**
 * LAND, simplified to what the globe can actually show.
 *
 * world-atlas land-50m carries ~60k points; the About globe draws it at a
 * radius of 305 reference px (up to ~380 CSS px), where one degree of arc at
 * the centre is ~5-6px. Re-projecting all of it cost ~27ms, several times a
 * second while the globe drifts. Douglas-Peucker on each ring, in degrees,
 * at a tolerance well under a pixel at the largest size, keeps the coastline
 * visually identical for a fraction of the points.
 *
 *   node scripts/simplify-land.mjs [toleranceDeg] [minRingPts]
 * Reads node_modules/world-atlas/land-50m.json (TopoJSON), writes
 * public/data/land-50m.json in the same TopoJSON shape (arcs simplified).
 * Every polygon's spherical area is checked against the original; any that
 * would invert or drift keeps its original arcs.
 */
const TOL = +(process.argv[2] ?? 0.05);
const src = JSON.parse(fs.readFileSync("node_modules/world-atlas/land-50m.json", "utf8"));

// Decode delta-encoded, quantized arcs to absolute lon/lat.
const [sx, sy] = src.transform.scale;
const [tx, ty] = src.transform.translate;
const arcs = src.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
});

const dp = (pts, tol) => {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-12;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L;
      if (d > best) { best = d; bi = i; }
    }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
};

// A closed ring (start == end) must be split at its farthest vertex first:
// measured against a zero-length baseline, every vertex scores 0 and the whole
// ring collapses — and a collapsed ring can come back with its winding
// flipped, which d3 reads as "the whole sphere except this island".
const simplifyArc = (arc) => {
  const closed = arc.length > 3 && arc[0][0] === arc.at(-1)[0] && arc[0][1] === arc.at(-1)[1];
  if (!closed) return dp(arc, TOL);
  let k = 1, far = -1;
  arc.forEach((p, i) => { const d = Math.hypot(p[0] - arc[0][0], p[1] - arc[0][1]); if (d > far) { far = d; k = i; } });
  const s = [...dp(arc.slice(0, k + 1), TOL), ...dp(arc.slice(k), TOL).slice(1)];
  return s.length >= 4 ? s : arc;
};

let out = arcs.map(simplifyArc);

// Safeguard: any polygon whose spherical area inverts, or drifts by more than
// 15% and more than a few on-screen pixels, keeps its original arcs.
const encode = (list) => list.map((arc) => {
  let px = 0, py = 0;
  return arc.map(([x, y]) => { const qx = Math.round((x - tx) / sx), qy = Math.round((y - ty) / sy); const d = [qx - px, qy - py]; px = qx; py = qy; return d; });
});
const areas = (topo) => {
  const geoms = topo.objects.land.geometries;
  return geoms.flatMap((g) => (g.type === "MultiPolygon" ? g.arcs : [g.arcs]).map((rings) => ({
    arcs: rings.flat().map((i) => (i < 0 ? ~i : i)),
    area: geoArea(feature(topo, { type: "Polygon", arcs: rings })),
  })));
};
const original = areas(src);
for (let pass = 0; pass < 5; pass++) {
  const test = areas({ ...src, arcs: encode(out) });
  let restored = 0;
  test.forEach((t, i) => {
    const o = original[i].area;
    // ~4 px² at the largest globe (r ≈ 380px, 1px² ≈ 6.9e-6 sr): a speck
    // can change shape freely below what a screen can show.
    if (t.area > 2 * Math.PI || Math.abs(t.area - o) > Math.max(0.15 * o, 3e-5)) {
      t.arcs.forEach((a) => { if (out[a] !== arcs[a]) { out[a] = arcs[a]; restored++; } });
    }
  });
  if (process.env.DIAG && pass === 0) {
    const fails = test.map((t, i) => ({ o: original[i].area, n: t.area, arcs: t.arcs.length, pts: t.arcs.reduce((a, k) => a + arcs[k].length, 0) }))
      .filter((f) => f.n > 2 * Math.PI || Math.abs(f.n - f.o) > Math.max(0.15 * f.o, 3e-5));
    console.log("failing polygons", fails.length, "inverted", fails.filter((f) => f.n > 2 * Math.PI).length);
    fails.sort((a, b) => b.pts - a.pts).slice(0, 6).forEach((f) => console.log("  orig", f.o.toExponential(2), "new", f.n.toExponential(2), "arcs", f.arcs, "pts", f.pts));
  }
  if (!restored) break;
  console.log(`pass ${pass}: restored ${restored} arcs`);
}

let before = 0, after = 0;
arcs.forEach((a, i) => { before += a.length; after += out[i].length; });

// Re-quantize and delta-encode, as TopoJSON expects.
src.arcs = encode(out);
fs.writeFileSync("public/data/land-50m.json", JSON.stringify(src));
console.log(`tolerance ${TOL}°: points ${before} -> ${after} (${((after / before) * 100).toFixed(0)}%), file ${Math.round(fs.statSync("public/data/land-50m.json").size / 1024)}KB`);
