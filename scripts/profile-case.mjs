import { chromium } from "playwright";

/**
 * The two new moves, on a 4x throttled phone: switching project inside the
 * Work environment, and the surface becoming a case-study hero. Same method
 * as scripts/profile-work.mjs — frames from rAF, style and script from CDP.
 */
const b = await chromium.launch();
const out = [];
for (let i = 0; i < 2; i++) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.addInitScript(() => {
    try { sessionStorage.setItem("jvr.booted", "1"); sessionStorage.setItem("jvr.spotlight", "1"); localStorage.setItem("jvr.sound", "off"); } catch {}
  });
  await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
  await p.bringToFront();
  await p.waitForTimeout(2500);
  await p.locator("button:visible", { hasText: "[Work]" }).first().click();
  await p.waitForFunction(() => document.querySelector(".experience").dataset.state === "work", null, { timeout: 30000 });
  await p.waitForTimeout(1800);

  const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const watch = () => p.evaluate(() => { window.__f = []; let l = performance.now(); const t = (x) => { window.__f.push(x - l); l = x; window.__r = requestAnimationFrame(t); }; window.__r = requestAnimationFrame(t); });
  const stop = () => p.evaluate(() => { cancelAnimationFrame(window.__r); const f = window.__f.slice(1); return { frames: f.length, dropped: f.filter((x) => x > 20).length, hitches: f.filter((x) => x > 33.5).length }; });

  // ---- switching project
  let m0 = await metrics();
  await watch();
  await p.evaluate(() => document.querySelector('[aria-label="Next project"]').click());
  await p.waitForTimeout(1200);
  const sw = await stop();
  let m1 = await metrics();
  sw.style = Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000);
  sw.script = Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000);

  // ---- work -> case study
  await p.evaluate(() => {
    const rows = [...document.querySelectorAll(".work-index__t")].map((n) => n.textContent);
    document.querySelectorAll(".work-index__row")[rows.indexOf("jorisvrr.com")].click();
  });
  await p.waitForTimeout(1600);
  m0 = await metrics();
  await watch();
  await p.evaluate(() => document.querySelector("a.work-cta__open").click());
  await p.waitForFunction(() => Boolean(document.querySelector(".case")), null, { timeout: 10000 });
  await p.waitForTimeout(900);
  const cs = await stop();
  m1 = await metrics();
  cs.style = Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000);
  cs.script = Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000);

  // ---- reading down the case study
  m0 = await metrics();
  await watch();
  for (const y of [600, 1400, 2600, 4200, 6000]) {
    await p.evaluate((t) => document.querySelector(".case").scrollTo({ top: t }), y);
    await p.waitForTimeout(260);
  }
  const rd = await stop();
  m1 = await metrics();
  rd.style = Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000);
  rd.script = Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000);

  out.push({ sw, cs, rd });
  await ctx.close();
}
const avg = (k, f) => Math.round(out.reduce((a, r) => a + r[k][f], 0) / out.length);
for (const [k, label] of [["sw", "switch project "], ["cs", "work -> case   "], ["rd", "reading a case "]]) {
  console.log(`${label} frames ${avg(k, "frames")}  dropped ${avg(k, "dropped")}  hitches ${avg(k, "hitches")}  |  style ${avg(k, "style")}ms  script ${avg(k, "script")}ms`);
}
await b.close();
