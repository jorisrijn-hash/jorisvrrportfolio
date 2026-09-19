import { chromium } from "playwright";

/**
 * ABOUT, measured — frame pacing where the new work runs:
 *   REST      About settled at the top (globe drift, meridian, orbit dots)
 *   SCROLL    wheel all the way down through the morph, then back up
 *   LINKS     settled at the bottom, network drawn
 *   VHS       Home -> About with the pass over it
 * "dropped" = frames over 20ms.
 */
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 950 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);

const start = () => p.evaluate(() => {
  window.__f = [];
  let last = performance.now();
  const t = (now) => { window.__f.push(now - last); last = now; window.__r = requestAnimationFrame(t); };
  window.__r = requestAnimationFrame(t);
});
const stop = async (label) => {
  const f = await p.evaluate(() => { cancelAnimationFrame(window.__r); return window.__f.slice(1); });
  const s = [...f].sort((a, b) => a - b);
  const q = (x) => s[Math.min(s.length - 1, Math.floor(s.length * x))].toFixed(1);
  console.log(`${label.padEnd(7)} frames ${String(f.length).padStart(4)}  p50 ${q(0.5)}ms  p95 ${q(0.95)}ms  worst ${s[s.length - 1].toFixed(1)}ms  dropped ${f.filter((x) => x > 20).length}`);
};

await start();
await p.getByRole("button", { name: "[About]" }).click();
await p.waitForTimeout(2600);
await stop("VHS+IN");

await start();
await p.waitForTimeout(4000);
await stop("REST");

await p.mouse.move(700, 500);
await start();
for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 90); await p.waitForTimeout(45); }
await p.waitForTimeout(700);
for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, -90); await p.waitForTimeout(45); }
await p.waitForTimeout(700);
await stop("SCROLL");

await p.locator(".about__scroll").evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
await p.waitForTimeout(1500);
await start();
await p.waitForTimeout(4000);
await stop("LINKS");
await b.close();
