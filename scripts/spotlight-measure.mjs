import { chromium } from "playwright";

/**
 * What the spotlight actually occupies: the union of everything it puts on
 * screen (surface included), as a share of the viewport.
 */
const OUT = process.argv[2] ?? "/tmp";
const TAG = process.argv[3] ?? "before";
const b = await chromium.launch();
for (const [w, h, name] of [[1600, 950, "desk"], [1440, 900, "laptop"], [390, 844, "phone"]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: name === "phone" ? 2 : 1, isMobile: name === "phone", hasTouch: name === "phone" });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
  await p.bringToFront();
  await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "spotlight", null, { timeout: 30000 });
  await p.waitForTimeout(1400);
  const m = await p.evaluate(() => {
    const parts = [...document.querySelectorAll(".spotlight__system, .spotlight__identity, .spotlight__close, .sp, .work-plane")];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    parts.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top);
      x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
    });
    const surface = document.querySelector(".work-plane")?.getBoundingClientRect();
    return {
      box: [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)],
      share: Math.round(((x1 - x0) * (y1 - y0)) / (innerWidth * innerHeight) * 1000) / 10,
      surface: surface ? [Math.round(surface.width), Math.round(surface.height)] : null,
      vw: innerWidth, vh: innerHeight,
    };
  });
  console.log(`${TAG} ${name.padEnd(7)} ${m.vw}x${m.vh}  box ${m.box[2]}x${m.box[3]} at (${m.box[0]},${m.box[1]})  surface ${m.surface?.join("x")}  ${m.share}% of viewport`);
  await p.screenshot({ path: `${OUT}/spot-${TAG}-${name}.png` });
  await ctx.close();
}
await b.close();
