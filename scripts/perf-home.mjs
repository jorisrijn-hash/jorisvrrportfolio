import { chromium } from "playwright";

/**
 * Frame budget for the loading -> home transition and the home idle loop.
 * Reports rAF intervals plus main-thread cost per frame from the DevTools
 * Performance domain (script, style, layout), which is what the SVG redraw
 * actually spends.
 */
const base = "http://localhost:4311/";
const b = await chromium.launch();

const sample = (p, n) =>
  p.evaluate(
    (n) =>
      new Promise((res) => {
        const t = [];
        let last = performance.now();
        const tick = (now) => {
          t.push(now - last);
          last = now;
          if (t.length < n) requestAnimationFrame(tick);
          else res(t);
        };
        requestAnimationFrame(tick);
      }),
    n,
  );

const metrics = async (cdp) =>
  Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));

function report(label, frames, m0, m1) {
  const s = frames.slice(5).sort((a, b) => a - b);
  const q = (x) => s[Math.min(s.length - 1, Math.floor(s.length * x))].toFixed(1);
  const per = (k) => (((m1[k] - m0[k]) * 1000) / frames.length).toFixed(2);
  console.log(
    `${label}: frames ${s.length}  p50 ${q(0.5)}ms  p95 ${q(0.95)}ms  worst ${s[s.length - 1].toFixed(1)}ms  ` +
      `dropped(>20ms) ${s.filter((x) => x > 20).length}`,
  );
  console.log(
    `  per frame — script ${per("ScriptDuration")}ms  style ${per("RecalcStyleDuration")}ms  ` +
      `layout ${per("LayoutDuration")}ms  task ${per("TaskDuration")}ms`,
  );
}

async function page(init) {
  const ctx = await b.newContext({ viewport: { width: 1920, height: 950 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Performance.enable");
  await p.addInitScript(init);
  return { ctx, p, cdp };
}

// 1. the transition itself
{
  const { ctx, p, cdp } = await page(() => {
    try { sessionStorage.removeItem("jvr.booted"); } catch {}
  });
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  await p.getByRole("button", { name: /^off$/i }).click();
  await p.waitForSelector(".sculpture", { state: "attached", timeout: 20000 });
  const m0 = await metrics(cdp);
  const f = await sample(p, 170);
  report("TRANSITION", f, m0, await metrics(cdp));
  await ctx.close();
}

// 2. the idle loop
{
  const { ctx, p, cdp } = await page(() => {
    try { sessionStorage.setItem("jvr.booted", "1"); } catch {}
  });
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
  await p.mouse.move(1200, 300);
  const m0 = await metrics(cdp);
  const f = await sample(p, 600);
  report("IDLE", f, m0, await metrics(cdp));
  const media = await p.evaluate(() => ({
    v: document.querySelectorAll("video").length,
    c: document.querySelectorAll("canvas").length,
    paths: document.querySelectorAll(".sculpture path").length,
  }));
  console.log("videos", media.v, "canvases", media.c, "sculpture paths", media.paths);
  await ctx.close();
}

await b.close();
