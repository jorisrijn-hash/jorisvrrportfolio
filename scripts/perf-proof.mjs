import { chromium } from "playwright";

/**
 * HOME -> SOCIAL PROOF, measured on the GPU (Metal): frame pacing while the
 * morph is scrolled down and back up, and while the proof rests with its
 * lanes drifting. Phones at 4x CPU throttle, tablets at 2x.
 */
const GPU = ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"];
const PROFILES = [
  ["mac-1440@2", { width: 1440, height: 900 }, 2, false, 1],
  ["desk-1920", { width: 1920, height: 950 }, 1, false, 1],
  ["tablet-768", { width: 768, height: 1024 }, 2, true, 2],
  ["phone-390", { width: 390, height: 844 }, 3, true, 4],
];
const b = await chromium.launch({ args: GPU });
for (const [name, viewport, dpr, mobile, cpu] of PROFILES) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await p.goto("http://localhost:4311/?preview=proof", { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
  const rec = () => p.evaluate(() => { window.__f = []; let l = performance.now(); const t = (x) => { window.__f.push(x - l); l = x; window.__r = requestAnimationFrame(t); }; window.__r = requestAnimationFrame(t); });
  const stop = async (label, m0) => {
    const f = await p.evaluate(() => { cancelAnimationFrame(window.__r); return window.__f.slice(1); });
    const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
    const s = [...f].sort((a, b) => a - b);
    console.log(`${name.padEnd(11)} ${label.padEnd(13)} frames ${String(f.length).padStart(4)}  dropped ${String(f.filter((x) => x > 20).length).padStart(3)}  hitches ${String(f.filter((x) => x > 33.5).length).padStart(2)}  p95 ${s[Math.floor(s.length * 0.95)].toFixed(1)}ms  script ${Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000)}ms  style ${Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000)}ms`);
  };
  const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const sc = p.locator(".proof-scroll");
  // real smooth scrolling in steps, as a wheel would
  let m0 = await metrics();
  await rec();
  for (let i = 0; i < 12; i++) { await sc.evaluate((el) => el.scrollBy({ top: (el.scrollHeight - el.clientHeight) / 12, behavior: "smooth" })); await p.waitForTimeout(160); }
  await p.waitForTimeout(900);
  await stop("scroll down", m0);
  m0 = await metrics();
  await rec();
  await p.waitForTimeout(4000);
  await stop("proof rest", m0);
  m0 = await metrics();
  await rec();
  for (let i = 0; i < 12; i++) { await sc.evaluate((el) => el.scrollBy({ top: -(el.scrollHeight - el.clientHeight) / 12, behavior: "smooth" })); await p.waitForTimeout(160); }
  await p.waitForTimeout(900);
  await stop("scroll up", m0);
  m0 = await metrics();
  await rec();
  await p.waitForTimeout(3000);
  await stop("home rest", m0);
  await ctx.close();
}
await b.close();
