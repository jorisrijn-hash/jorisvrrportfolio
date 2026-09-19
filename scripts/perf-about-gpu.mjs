import { chromium } from "playwright";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * ABOUT scroll, on the GPU (Metal) — two different clocks:
 *   main  rAF cadence: the JS morph (material, orbit dots, meridian)
 *   comp  compositor frames presented: what scrolling and the globe's
 *         scroll-timeline glide actually look like
 * Plus where the globe really is on screen each frame, so a stepping glide
 * shows up as uneven movement.
 */
const b = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 950 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
await p.getByRole("button", { name: "[About]" }).click();
await p.waitForTimeout(3200);
console.log("glide on compositor:", await p.evaluate(() => document.querySelector(".about__globe").getAnimations().length > 0));
await p.mouse.move(700, 500);
const file = path.join(os.tmpdir(), "about-gpu-trace.json");
await b.startTracing(p, { path: file, categories: ["cc", "benchmark"] });
await p.evaluate(() => {
  window.__f = [];
  const g = document.querySelector(".about__globe");
  let l = performance.now();
  const t = (x) => { window.__f.push([x - l, new DOMMatrix(getComputedStyle(g).transform).m41]); l = x; window.__r = requestAnimationFrame(t); };
  window.__r = requestAnimationFrame(t);
});
for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 90); await p.waitForTimeout(45); }
await p.waitForTimeout(600);
for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, -90); await p.waitForTimeout(45); }
await p.waitForTimeout(600);
const f = await p.evaluate(() => { cancelAnimationFrame(window.__r); return window.__f.slice(1); });
await b.stopTracing();
await b.close();

const main = f.map((x) => x[0]);
console.log(`main  frames ${main.length}  dropped(>20ms) ${main.filter((x) => x > 20).length}`);
const ev = JSON.parse(fs.readFileSync(file, "utf8")).traceEvents;
const pres = ev.filter((e) => e.ph === "b" && e.name === "SubmitCompositorFrameToPresentationCompositorFrame").map((e) => e.ts).sort((a, b) => a - b);
const gaps = pres.slice(1).map((t, i) => (t - pres[i]) / 1000).filter((g) => g < 200);
const sg = [...gaps].sort((a, b) => a - b);
console.log(`comp  frames ${pres.length}  p50 ${sg[sg.length >> 1].toFixed(1)}ms  p95 ${sg[Math.floor(sg.length * 0.95)].toFixed(1)}ms  over 20ms ${gaps.filter((g) => g > 20).length}`);
