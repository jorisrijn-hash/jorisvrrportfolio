import { chromium } from "playwright";

/**
 * FEATURED WORK SPOTLIGHT — behaviour. PASS/FAIL lines, like verify-a11y.mjs.
 *
 *   trigger    surfaces ~2s after Home settles, once per session, never while
 *              the tab is hidden, never again once closed
 *   close      the × and Escape both reverse it, and Home comes back whole
 *   work       [Work] carries the same surface into the Work environment,
 *              which arrives intact; [About] closes first, then goes
 *   content    only what content/projects.ts confirms is on screen
 */
const BASE = "http://localhost:4311/";
let fails = 0;
const pass = (name, ok, info = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? `  (${info})` : ""}`);
};
const b = await chromium.launch();
const state = (p) => p.evaluate(() => document.querySelector(".experience")?.dataset.state);
const open = async (opts = {}) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await p.goto(BASE, { waitUntil: "networkidle" });
  // A page that is not frontmost reports itself hidden, and the spotlight
  // (correctly) waits for it to come back. Real tabs have focus; give this
  // one focus too, or the wait never ends.
  await p.bringToFront();
  return p;
};
const errors = [];
const waitState = (p, s, timeout = 15000) =>
  p.waitForFunction((x) => document.querySelector(".experience")?.dataset.state === x, s, { timeout });

// ---- trigger timing
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.addInitScript(() => {
    try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {}
    // when Home settled, and when the spotlight began
    window.__t = {};
    new MutationObserver(() => {
      const s = document.querySelector(".experience")?.dataset.state;
      if (s && window.__t[s] === undefined) window.__t[s] = performance.now();
      // (an init script runs before <html> exists; document is observable now)
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-state"] });
  });
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.bringToFront();
  await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "to-spotlight", null, { timeout: 12000 });
  const dt = await p.evaluate(() => window.__t["to-spotlight"] - window.__t.home);
  pass("surfaces about 2s after Home settles", dt > 1800 && dt < 3200, `${Math.round(dt)}ms after Home`);
  await waitState(p, "spotlight");
  const ui = await p.evaluate(() => ({
    title: document.querySelector(".sp__title")?.textContent,
    type: document.querySelector(".sp__type")?.textContent,
    roles: document.querySelector(".sp__roles")?.textContent,
    stack: document.querySelector(".sp__stack"),
    pending: !!document.querySelector(".sp__cta[data-pending]"),
    secondary: (() => { const a = document.querySelector("a.sp__cta"); return a ? a.getAttribute("href") : null; })(),
    media: document.querySelector(".work-media img")?.currentSrc?.split("/work/")[1],
    surface: !!document.querySelector('.work[data-variant="spotlight"]'),
    workUi: getComputedStyle(document.querySelector(".work-info")).display,
  }));
  pass("the surface is the Work surface, set aside", ui.surface && ui.workUi === "none");
  pass("shows only confirmed project data", ui.title === "Goodreads" && ui.type === "Full-stack application"
    && ui.roles === "Full-stack development / Product design" && ui.stack === null, JSON.stringify(ui.roles));
  // The secondary action states the truth about the case study, whichever it
  // is: a link once one exists, and "// in preparation" until then. It is
  // never a dead link.
  pass("the case study is offered or declared, never faked",
    ui.secondary === "/work/goodreads" ? !ui.pending : ui.pending,
    ui.secondary ?? "// in preparation");
  pass("the project's media is on the surface", !!ui.media, ui.media);
  await p.context().close();
}

// ---- once per session
{
  const p = await open();
  await waitState(p, "spotlight");
  await p.locator(".sp__close").click();
  await waitState(p, "home");
  await p.waitForTimeout(3500);
  pass("does not surface again after being closed", (await state(p)) === "home");
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(4000);
  pass("does not surface again after a reload in the same session", (await state(p)) === "home");
  const fresh = await open();                       // a new context = a new session
  await waitState(fresh, "spotlight", 12000);
  pass("a new session is eligible again", (await state(fresh)) === "spotlight");
  await fresh.context().close();
  await p.context().close();
}

// ---- close reverses, Home comes back whole
{
  const p = await open();
  await waitState(p, "spotlight");
  await p.keyboard.press("Escape");
  pass("Escape starts the reverse", (await state(p)) === "spotlight-to-home");
  await waitState(p, "home");
  await p.waitForTimeout(1200);
  const home = await p.evaluate(() => ({
    spotlight: document.querySelectorAll(".spotlight").length,
    work: document.querySelectorAll(".work").length,
    sculpture: document.querySelectorAll(".sculpture path").length,
    hudTitle: getComputedStyle(document.querySelector(".home-hud__title")).opacity,
    stageFlags: [...document.querySelector(".experience").attributes].map((a) => a.name).filter((n) => n.startsWith("data-x-") || n.startsWith("data-sp")),
  }));
  pass("closing removes the spotlight and its surface", home.spotlight === 0 && home.work === 0);
  pass("Home's sculpture is drawing again", home.sculpture > 300, `${home.sculpture} paths`);
  pass("Home's title returns", +home.hudTitle > 0.9, home.hudTitle);
  pass("no spotlight flags left on the stage", !home.stageFlags.some((f) => f.includes("spotlight") || f.startsWith("data-sp")), home.stageFlags.join(","));
  await p.context().close();
}

// ---- closing mid-entrance
{
  const p = await open();
  await waitState(p, "to-spotlight");
  await p.waitForTimeout(500);                       // half-formed
  await p.keyboard.press("Escape");
  await waitState(p, "home", 8000);
  await p.waitForTimeout(800);
  pass("can be dismissed while it is still forming", (await state(p)) === "home"
    && (await p.evaluate(() => document.querySelectorAll(".work").length)) === 0);
  await p.context().close();
}

// ---- [Work] carries the surface on
{
  const p = await open();
  await waitState(p, "spotlight");
  await p.locator(".sp__cta[data-primary]").click();
  pass("[See all featured work] goes straight on, without closing first", (await state(p)) === "spotlight-to-work");
  const carried = await p.evaluate(() => document.querySelectorAll(".work").length);
  await waitState(p, "work", 12000);
  await p.waitForTimeout(1500);
  const w = await p.evaluate(() => ({
    surfaces: document.querySelectorAll(".work").length,
    variant: document.querySelector(".work")?.getAttribute("data-variant"),
    scale: getComputedStyle(document.querySelector(".work")).getPropertyValue("--sp-scale").trim(),
    info: getComputedStyle(document.querySelector(".work-info")).display,
    title: document.querySelector(".work-info__title")?.textContent,
    index: document.querySelectorAll(".work-index__row").length,
    spotlight: document.querySelectorAll(".spotlight").length,
  }));
  pass("the same surface carries through (one mount)", carried === 1 && w.surfaces === 1);
  pass("it arrives as the full Work environment", w.variant === null && w.scale === "1" && w.info !== "none" && w.title === "Goodreads" && w.index === 4, JSON.stringify(w));
  pass("spotlight-only interface is gone", w.spotlight === 0);
  await p.context().close();
}

// ---- [About] closes first, then goes
{
  const p = await open();
  await waitState(p, "spotlight");
  await p.locator("button:visible", { hasText: "[About]" }).first().click();
  await waitState(p, "to-about", 10000);
  await waitState(p, "about", 12000);
  pass("[About] from the spotlight closes it, then goes to About", (await state(p)) === "about"
    && (await p.evaluate(() => document.querySelectorAll(".spotlight").length)) === 0);
  await p.context().close();
}

// ---- reduced motion
{
  const p = await open({ reducedMotion: "reduce" });
  await waitState(p, "spotlight", 12000);
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => ({
    title: document.querySelector(".sp__title")?.textContent,
    visible: getComputedStyle(document.querySelector(".sp__title > span")).transform,
    cta: getComputedStyle(document.querySelector(".sp__cta[data-primary]")).opacity,
    media: !!document.querySelector(".work-media img"),
  }));
  pass("reduced motion still presents the project", r.title === "Goodreads" && r.media && +r.cta > 0.9, JSON.stringify(r));
  await p.keyboard.press("Escape");
  await waitState(p, "home", 8000);
  pass("reduced motion closes cleanly", (await state(p)) === "home");
  await p.context().close();
}

// ---- hidden tab: the wait does not run out of sight
// (a headless page is never really hidden — bringToFront on another page
// leaves visibilityState "visible" — so the property is driven directly)
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {}
    window.__vis = "hidden";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => window.__vis });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => window.__vis === "hidden" });
  });
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(4000);
  const hiddenState = await state(p);
  pass("a hidden tab does not surface it unseen", hiddenState === "home", `while hidden: ${hiddenState}`);
  await p.evaluate(() => { window.__vis = "visible"; document.dispatchEvent(new Event("visibilitychange")); });
  await waitState(p, "spotlight", 12000);
  pass("it surfaces once the tab comes back", (await state(p)) === "spotlight");
  await ctx.close();
}

pass("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
await b.close();
console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
