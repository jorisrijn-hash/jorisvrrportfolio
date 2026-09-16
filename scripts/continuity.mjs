import { chromium } from "playwright";

/**
 * CONTINUITY — is it one object moving, or does it jump?
 *
 * The core is emitted as a 64-point polygon (lib/sculpture/scene.ts), which no
 * other part shares: cubes give 4-point faces, tetrahedra 3. So it can be
 * picked out of the DOM by vertex count and followed frame by frame as the
 * SAME object. Per frame we record its centroid; the step between frames is
 * how far it travelled, and the change in step is its acceleration. A morph
 * gives a smooth step curve, a snap gives one frame far outside its neighbours.
 */
const TRACE = `(() => {
  window.__tr = [];
  const svg = document.querySelector(".sculpture");
  const t0 = performance.now();
  const tick = () => {
    // The core is the ONLY 64-point polygon: exactly 128 numbers. Selecting by
    // "most numbers" would have caught the 11 link nodes (176) or the orbit
    // circle (194) instead, both of which barely move.
    let core = null, cand = 0;
    for (const p of svg.querySelectorAll("path")) {
      const d = p.getAttribute("d");
      if (!d || d.length < 40) continue;
      const nums = d.match(/-?\\d+(?:\\.\\d+)?/g);
      if (!nums || nums.length !== 128) continue;
      cand++;
      if (!core) core = nums;
    }
    if (core) {
      let sx = 0, sy = 0, n = 0;
      for (let i = 0; i + 1 < core.length; i += 2) { sx += +core[i]; sy += +core[i + 1]; n++; }
      const cx = sx / n, cy = sy / n;
      let r = 0;
      for (let i = 0; i + 1 < core.length; i += 2) r += Math.hypot(+core[i] - cx, +core[i + 1] - cy);
      window.__tr.push([performance.now() - t0, cx, cy, r / n, cand]);
    } else {
      window.__tr.push([performance.now() - t0, NaN, NaN, NaN, 0]);
    }
    window.__raf = requestAnimationFrame(tick);
  };
  tick();
})()`;

function report(label, tr) {
  const lost = tr.filter((r) => Number.isNaN(r[1])).length;
  const rs = tr.filter((r) => !Number.isNaN(r[3])).map((r) => r[3]);
  const rmin = Math.min(...rs), rmax = Math.max(...rs);

  // Per-frame DISTANCE is not motion: a dropped frame doubles the gap and looks
  // like a jump. Everything below is per-millisecond, so frame pacing cannot
  // masquerade as a lurch.
  const vel = [];
  for (let i = 1; i < tr.length; i++) {
    const dt = tr[i][0] - tr[i - 1][0];
    if (dt <= 0 || dt > 120) continue;
    if (Number.isNaN(tr[i][1]) || Number.isNaN(tr[i - 1][1])) continue;
    vel.push([tr[i][0], Math.hypot(tr[i][1] - tr[i - 1][1], tr[i][2] - tr[i - 1][2]) / dt, dt]);
  }
  const moving = vel.filter((v) => v[1] > 0.004);
  const vs = moving.map((v) => v[1]).sort((x, y) => x - y);
  const peak = vs[vs.length - 1] || 0;
  const med = vs[Math.floor(vs.length / 2)] || 0;

  // Acceleration: change in velocity over the time between samples (px/ms^2).
  let worst = [0, 0];
  for (let i = 1; i < vel.length; i++) {
    const dt = vel[i][0] - vel[i - 1][0];
    if (dt <= 0) continue;
    const a = Math.abs(vel[i][1] - vel[i - 1][1]) / dt;
    if (a > worst[1]) worst = [vel[i][0], a];
  }
  const dropped = vel.filter((v) => v[2] > 20).length;
  console.log(
    `${label} (core): moving ${moving.length} frames | peak vel ${peak.toFixed(3)}px/ms | ` +
    `median ${med.toFixed(3)} | worst accel ${worst[0].toFixed(0)}ms:${worst[1].toFixed(4)}px/ms2 | ` +
    `radius ${rmin.toFixed(0)}->${rmax.toFixed(0)}px | ${dropped} long frames` +
    (lost ? ` | !! core missing ${lost} frames` : "")
  );
}

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 950 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
await p.waitForTimeout(1200);

const run = async (label, name, wait) => {
  await p.evaluate(TRACE);
  await p.getByRole("button", { name }).click();
  await p.waitForTimeout(wait);
  report(label, await p.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__tr; }));
};

await p.evaluate(TRACE);
await p.waitForTimeout(3000);
report("HOME IDLE", await p.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__tr; }));
await run("HOME->WORK ", "[Work]", 4200);
await run("WORK->HOME ", "[Home]", 3600);
await run("HOME->ABOUT", "[About]", 3600);
await run("ABOUT->HOME", "[Home]", 3200);
await run("HOME->WORK2", "[Work]", 4200);
await run("WORK->ABOUT", "[About]", 4200);
await b.close();
