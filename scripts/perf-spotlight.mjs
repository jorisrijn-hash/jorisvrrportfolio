import { chromium } from "playwright";

/**
 * FEATURED WORK SPOTLIGHT, measured on the GPU (Metal), at real pixel ratios.
 *
 *   home-idle     Home before the spotlight can exist (the session flag set,
 *                 so nothing is scheduled) — the reference
 *   home-waiting  Home during the 2s wait, with the trigger armed
 *   entrance      the formation
 *   settled       the spotlight at rest
 *   close         the reverse, back to Home
 *   to-work       the surface carrying on into Work
 *
 * Phones run at 4x CPU throttle, tablets at 2x.
 */
const GPU = ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"];
const PROFILES = [
  ["mac-1440@2", { width: 1440, height: 900 }, 2, false, 1],
  ["phone-390", { width: 390, height: 844 }, 3, true, 4],
];
const KEY = "jvr.spotlight";

const b = await chromium.launch({ args: GPU });
for (const [name, viewport, dpr, mobile, cpu] of PROFILES) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const rec = () => p.evaluate(() => { window.__f = []; let l = performance.now(); const t = (x) => { window.__f.push(x - l); l = x; window.__r = requestAnimationFrame(t); }; window.__r = requestAnimationFrame(t); });
  const stop = async (label, m0) => {
    const f = await p.evaluate(() => { cancelAnimationFrame(window.__r); return window.__f.slice(1); });
    const m1 = await metrics();
    const s = [...f].sort((a, b) => a - b);
    console.log(`${name.padEnd(11)} ${label.padEnd(13)} frames ${String(f.length).padStart(4)}  dropped ${String(f.filter((x) => x > 20).length).padStart(3)}  hitches ${String(f.filter((x) => x > 33.5).length).padStart(2)}  p95 ${(s[Math.floor(s.length * 0.95)] ?? 0).toFixed(1)}ms  script ${Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000)}ms  style ${Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000)}ms`);
  };
  const waitState = (s, t = 15000) => p.waitForFunction((x) => document.querySelector(".experience")?.dataset.state === x, s, { timeout: t });

  // ---- reference: Home with the spotlight already spent for this session
  await p.addInitScript((k) => {
    try { sessionStorage.setItem("jvr.booted", "1"); sessionStorage.setItem(k, "1"); localStorage.setItem("jvr.sound", "off"); } catch {}
  }, KEY);
  await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
  await p.bringToFront();
  await p.waitForTimeout(2500);
  let m0 = await metrics();
  await rec();
  await p.waitForTimeout(5000);
  await stop("home-idle", m0);
  await ctx.close();

  // ---- armed: the same Home, with the trigger pending
  const ctx2 = await b.newContext({ viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const p2 = await ctx2.newPage();
  p2.on("pageerror", (e) => console.log("  PAGE ERROR:", String(e).slice(0, 160)));
  const cdp2 = await ctx2.newCDPSession(p2);
  await cdp2.send("Performance.enable");
  await cdp2.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  const metrics2 = async () => Object.fromEntries((await cdp2.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const rec2 = () => p2.evaluate(() => { window.__f = []; let l = performance.now(); const t = (x) => { window.__f.push(x - l); l = x; window.__r = requestAnimationFrame(t); }; window.__r = requestAnimationFrame(t); });
  const stop2 = async (label, m0) => {
    const f = await p2.evaluate(() => { cancelAnimationFrame(window.__r); return window.__f.slice(1); });
    const m1 = await metrics2();
    const s = [...f].sort((a, b) => a - b);
    console.log(`${name.padEnd(11)} ${label.padEnd(13)} frames ${String(f.length).padStart(4)}  dropped ${String(f.filter((x) => x > 20).length).padStart(3)}  hitches ${String(f.filter((x) => x > 33.5).length).padStart(2)}  p95 ${(s[Math.floor(s.length * 0.95)] ?? 0).toFixed(1)}ms  script ${Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000)}ms  style ${Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000)}ms`);
  };
  const waitState2 = (s, t = 15000) => p2.waitForFunction((x) => document.querySelector(".experience")?.dataset.state === x, s, { timeout: t });
  await p2.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await p2.goto("http://localhost:4311/", { waitUntil: "networkidle" });
  await p2.bringToFront();
  let m2 = await metrics2();
  await rec2();
  await waitState2("to-spotlight", 12000);
  await stop2("home-waiting", m2);

  m2 = await metrics2();
  await rec2();
  await waitState2("spotlight", 12000);
  await stop2("entrance", m2);

  m2 = await metrics2();
  await rec2();
  await p2.waitForTimeout(4000);
  await stop2("settled", m2);

  m2 = await metrics2();
  await rec2();
  await p2.keyboard.press("Escape");
  await waitState2("home", 12000);
  await p2.waitForTimeout(600);
  await stop2("close", m2);

  // and once more, into Work
  await p2.evaluate(() => { try { sessionStorage.removeItem("jvr.spotlight"); } catch {} });
  await p2.reload({ waitUntil: "networkidle" });
  await waitState2("spotlight", 15000);
  m2 = await metrics2();
  await rec2();
  await p2.locator(".spotlight__cta--all").click();
  await waitState2("work", 15000);
  await p2.waitForTimeout(800);
  await stop2("to-work", m2);
  await ctx2.close();
}
await b.close();
