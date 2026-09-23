import { chromium } from "playwright";

/**
 * HOME -> WORK on a 4x throttled phone: what the formation actually writes,
 * and what that costs. `d`, `fill` and `fill-opacity` are CSS properties in
 * Chromium, so every path write invalidates that element's style.
 */
const b = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const runs = [];
for (let i = 0; i < 2; i++) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.addInitScript(() => {
    try { sessionStorage.setItem("jvr.booted", "1"); sessionStorage.setItem("jvr.spotlight", "1"); localStorage.setItem("jvr.sound", "off"); } catch {}
    window.__w = { pathD: 0, pathOther: 0 };
    const sa = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (n, v) {
      if (this.tagName === "path") { if (n === "d") window.__w.pathD++; else window.__w.pathOther++; }
      return sa.call(this, n, v);
    };
  });
  await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
  await p.bringToFront();
  await p.waitForTimeout(2500);
  const m0 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  await p.evaluate(() => { window.__w = { pathD: 0, pathOther: 0 }; window.__f = []; let l = performance.now(); const t = (x) => { window.__f.push(x - l); l = x; window.__r = requestAnimationFrame(t); }; window.__r = requestAnimationFrame(t); });
  await p.locator("button:visible", { hasText: "[Work]" }).first().click();
  await p.waitForFunction(() => document.querySelector(".experience").dataset.state === "work", null, { timeout: 25000 });
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => { cancelAnimationFrame(window.__r); const f = window.__f.slice(1); return { ...window.__w, frames: f.length, dropped: f.filter((x) => x > 20).length, hitches: f.filter((x) => x > 33.5).length }; });
  const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  r.style = Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000);
  r.script = Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000);
  runs.push(r);
  await ctx.close();
}
const avg = (k) => Math.round(runs.reduce((a, r) => a + r[k], 0) / runs.length);
console.log(`home->work (phone 390 @4x, mean of ${runs.length}):  d-writes ${avg("pathD")}  other path writes ${avg("pathOther")}  |  frames ${avg("frames")}  dropped ${avg("dropped")}  hitches ${avg("hitches")}  |  style ${avg("style")}ms  script ${avg("script")}ms`);
await b.close();
