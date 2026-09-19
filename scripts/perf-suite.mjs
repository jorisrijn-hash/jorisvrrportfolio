import { chromium } from "playwright";
import fs from "fs";

/**
 * PERF SUITE — one pass through the whole experience, per device profile,
 * measured on the real GPU (Metal) at real pixel ratios. Phones and tablets
 * also run under CPU throttling.
 *
 * Per scene:
 *   frames    rAF intervals: count, >20ms (dropped), >33ms (a visible hitch), p95
 *   long      long tasks (>50ms): count and total ms
 *   main      script / style / layout ms (CDP Performance metrics)
 *   react     commits, and function-component fibers that re-rendered
 *   dom       DOM nodes at the end of the scene
 * Plus: first-load network by type, LCP, CLS, cursor lag, heap across repeated
 * navigation, and listener count.
 *
 *   node scripts/perf-suite.mjs [out.json] [profile,profile]
 */
const URL = process.env.URL ?? "http://localhost:4311/";
const OUT = process.argv[2];
const ONLY = process.argv[3]?.split(",");
const GPU = ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"];

const PROFILES = {
  "desk-1920": { viewport: { width: 1920, height: 950 }, dpr: 1 },
  "mac-1440@2": { viewport: { width: 1440, height: 900 }, dpr: 2 },
  "phone-390": { viewport: { width: 390, height: 844 }, dpr: 3, mobile: true, cpu: 4 },
  "phone-430": { viewport: { width: 430, height: 932 }, dpr: 3, mobile: true, cpu: 4 },
  "tablet-768": { viewport: { width: 768, height: 1024 }, dpr: 2, mobile: true, cpu: 2 },
};

const INIT = () => {
  // React commits and re-rendered component fibers, via the DevTools hook
  // (React calls it in production builds too).
  window.__commits = 0;
  window.__fibers = 0;
  const walk = (f) => {
    let n = 0;
    const stack = [f];
    while (stack.length) {
      const x = stack.pop();
      if (!x) continue;
      if (typeof x.type === "function") {
        const a = x.alternate;
        if (!a || a.memoizedProps !== x.memoizedProps || a.memoizedState !== x.memoizedState) n++;
      }
      if (x.child) stack.push(x.child);
      if (x.sibling) stack.push(x.sibling);
    }
    return n;
  };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers: new Map(), supportsFiber: true, isDisabled: false,
    inject() { return 1; }, checkDCE() {}, onScheduleFiberRoot() {}, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {},
    onCommitFiberRoot(_id, root) { window.__commits++; try { window.__fibers += walk(root.current); } catch { /* */ } },
  };
  window.__long = [];
  window.__lcp = null;
  window.__cls = 0;
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(e.duration))).observe({ type: "longtask", buffered: true });
    new PerformanceObserver((l) => { const e = l.getEntries().at(-1); window.__lcp = { t: e.startTime, el: e.element?.className || e.element?.tagName || e.url }; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: "layout-shift", buffered: true });
  } catch { /* */ }
  window.__rec = {
    start() {
      this.f = [];
      this.lag = [];
      this.c0 = window.__commits;
      this.fb0 = window.__fibers;
      this.l0 = window.__long.length;
      let last = performance.now();
      const cursor = () => document.querySelector(".cursor");
      const loop = (now) => {
        this.f.push(now - last);
        last = now;
        const c = cursor();
        if (c && window.__ptr) {
          const m = new DOMMatrix(getComputedStyle(c).transform);
          this.lag.push(Math.hypot(m.m41 - window.__ptr.x, m.m42 - window.__ptr.y));
        }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(this.raf);
      const f = this.f.slice(1);
      const s = [...f].sort((a, b) => a - b);
      const lag = [...this.lag].sort((a, b) => a - b);
      const long = window.__long.slice(this.l0);
      return {
        frames: f.length,
        dropped: f.filter((x) => x > 20).length,
        hitch: f.filter((x) => x > 33.5).length,
        p95: +(s[Math.floor(s.length * 0.95)] ?? 0).toFixed(1),
        long: long.length,
        longMs: Math.round(long.reduce((a, b) => a + b, 0)),
        commits: window.__commits - this.c0,
        fibers: window.__fibers - this.fb0,
        dom: document.getElementsByTagName("*").length,
        cursorLag: lag.length ? +(lag[Math.floor(lag.length / 2)]).toFixed(1) : null,
        cursorLag95: lag.length ? +(lag[Math.floor(lag.length * 0.95)]).toFixed(1) : null,
      };
    },
  };
  addEventListener("pointermove", (e) => { window.__ptr = { x: e.clientX, y: e.clientY }; }, { capture: true, passive: true });
};

async function run(name, prof, browser) {
  const ctx = await browser.newContext({
    viewport: prof.viewport, deviceScaleFactor: prof.dpr, isMobile: !!prof.mobile, hasTouch: !!prof.mobile,
  });
  const p = await ctx.newPage();
  await p.addInitScript(INIT);
  await p.addInitScript(() => { try { localStorage.setItem("jvr.sound", "off"); } catch { /* */ } });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Performance.enable");
  if (prof.cpu) await cdp.send("Emulation.setCPUThrottlingRate", { rate: prof.cpu });

  const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));

  // ---- first load: network until the gate is up
  const net = [];
  p.on("requestfinished", async (r) => {
    try { const s = await r.sizes(); net.push({ type: r.resourceType(), url: r.url().replace(URL, "/"), bytes: s.responseBodySize, at: Date.now() }); } catch { /* */ }
  });
  const t0 = Date.now();
  await p.goto(URL, { waitUntil: "domcontentloaded" });
  await p.locator(".gate__btn").first().waitFor({ timeout: 20000 });
  const gateAt = Date.now() - t0;
  await p.waitForTimeout(1500);
  const firstLoad = {};
  for (const n of net) firstLoad[n.type] = (firstLoad[n.type] ?? 0) + n.bytes;
  const firstLoadFiles = net.map((n) => `${n.type}:${n.url}:${Math.round(n.bytes / 1024)}k`);

  const scenes = {};
  const state = () => p.evaluate(() => document.querySelector(".experience")?.dataset.state);
  const waitState = (s, timeout = 20000) => p.waitForFunction((x) => document.querySelector(".experience")?.dataset.state === x, s, { timeout });
  const nav = (label) => p.locator("button:visible", { hasText: `[${label}]` }).first().click();
  const scene = async (label, body) => {
    const m0 = await metrics();
    await p.evaluate(() => window.__rec.start());
    await body();
    const r = await p.evaluate(() => window.__rec.stop());
    const m1 = await metrics();
    r.script = Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000);
    r.style = Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000);
    r.layout = Math.round((m1.LayoutDuration - m0.LayoutDuration) * 1000);
    scenes[label] = r;
  };
  const wiggle = async (ms) => {
    if (prof.mobile) { await p.waitForTimeout(ms); return; }
    const { width: w, height: h } = prof.viewport;
    const end = Date.now() + ms;
    let a = 0;
    while (Date.now() < end) {
      a += 0.05;   // ~1800px/s at 1920 — a brisk hand, not a flick
      await p.mouse.move(w / 2 + Math.cos(a) * w * 0.3, h / 2 + Math.sin(a * 1.3) * h * 0.3);
      await p.waitForTimeout(16);
    }
  };

  // ---- intro (sound off)
  await scene("intro", async () => {
    await p.locator(".gate__btn").nth(1).click();
    await waitState("home", 30000);
    await p.waitForTimeout(600);
  });
  await scene("home-idle", () => wiggle(5000));
  await scene("home>work", async () => { await nav("Work"); await waitState("work"); await p.waitForTimeout(500); });
  await scene("work-idle", () => wiggle(3000));
  await scene("work>home", async () => { await nav("Home"); await waitState("home"); await p.waitForTimeout(500); });
  await scene("home>about", async () => { await nav("About"); await waitState("about"); await p.waitForTimeout(500); });
  await scene("about-idle", () => wiggle(3000));
  await scene("about-scroll", async () => {
    for (let i = 0; i < 14; i++) { await p.locator(".about__scroll").evaluate((el) => el.scrollBy({ top: 240, behavior: "smooth" })); await p.waitForTimeout(110); }
    await p.waitForTimeout(500);
    for (let i = 0; i < 14; i++) { await p.locator(".about__scroll").evaluate((el) => el.scrollBy({ top: -240, behavior: "smooth" })); await p.waitForTimeout(110); }
    await p.waitForTimeout(500);
  });
  await scene("about>work", async () => { await nav("Work"); await waitState("work"); await p.waitForTimeout(500); });
  await scene("work>about", async () => { await nav("About"); await waitState("about"); await p.waitForTimeout(500); });
  await scene("about>home", async () => { await nav("Home"); await waitState("home"); await p.waitForTimeout(500); });

  // ---- repeated navigation: heap and listeners must not climb
  const heap = async () => { await cdp.send("HeapProfiler.collectGarbage"); return Math.round((await cdp.send("Runtime.getHeapUsage")).usedSize / 1024); };
  const listeners = async () => {
    const { result } = await cdp.send("Runtime.evaluate", { expression: "window" });
    const w = (await cdp.send("DOMDebugger.getEventListeners", { objectId: result.objectId })).listeners.length;
    const { result: d } = await cdp.send("Runtime.evaluate", { expression: "document.documentElement" });
    return w + (await cdp.send("DOMDebugger.getEventListeners", { objectId: d.objectId })).listeners.length;
  };
  const heap0 = await heap();
  const lis0 = await listeners();
  const dom0 = await p.evaluate(() => document.getElementsByTagName("*").length);
  for (let i = 0; i < 4; i++) {
    for (const [to, st] of [["Work", "work"], ["Home", "home"], ["About", "about"], ["Home", "home"]]) { await nav(to); await waitState(st); await p.waitForTimeout(250); }
  }
  await p.waitForTimeout(800);
  const repeat = { heapKB: [heap0, await heap()], listeners: [lis0, await listeners()], dom: [dom0, await p.evaluate(() => document.getElementsByTagName("*").length)] };

  const vitals = await p.evaluate(() => ({ lcp: window.__lcp, cls: +window.__cls.toFixed(4) }));
  await ctx.close();
  return { name, gateAt, firstLoad, firstLoadFiles, vitals, scenes, repeat, errors };
}

const browser = await chromium.launch({ args: GPU });
const results = [];
for (const [name, prof] of Object.entries(PROFILES)) {
  if (ONLY && !ONLY.includes(name)) continue;
  try {
    const r = await run(name, prof, browser);
    results.push(r);
    console.log(`\n=== ${name}   gate ${r.gateAt}ms   LCP ${Math.round(r.vitals.lcp?.t ?? -1)}ms (${r.vitals.lcp?.el})   CLS ${r.vitals.cls}`);
    console.log("first load KB:", Object.entries(r.firstLoad).map(([k, v]) => `${k} ${Math.round(v / 1024)}`).join("  "));
    console.log("scene".padEnd(13), "frames drop hitch  p95 | long(ms) | script style layout | commits fibers |  dom | cursor lag p50/p95");
    for (const [s, v] of Object.entries(r.scenes)) {
      console.log(
        s.padEnd(13), String(v.frames).padStart(6), String(v.dropped).padStart(4), String(v.hitch).padStart(5), String(v.p95).padStart(5),
        "|", `${v.long}(${v.longMs})`.padStart(8), "|", String(v.script).padStart(6), String(v.style).padStart(5), String(v.layout).padStart(6),
        "|", String(v.commits).padStart(7), String(v.fibers).padStart(6), "|", String(v.dom).padStart(4),
        "|", v.cursorLag === null ? "-" : `${v.cursorLag}/${v.cursorLag95}px`,
      );
    }
    console.log("repeat nav:", JSON.stringify(r.repeat), r.errors.length ? `| ERRORS ${r.errors}` : "");
  } catch (e) {
    console.log(`\n=== ${name} FAILED: ${String(e).slice(0, 300)}`);
  }
}
await browser.close();
if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
