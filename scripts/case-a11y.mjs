import { chromium } from "playwright";

/**
 * THE NEW SURFACES, without a pointer and without motion.
 *
 *   keyboard   the index, the arrows, the decisions and the case study are
 *              reachable and operable by keyboard, with visible focus
 *   semantics  one h1 per case study, sections labelled, state announced
 *   reduced    prefers-reduced-motion settles everything at once
 */
const BASE = "http://localhost:4311";
let fails = 0;
const pass = (n, ok, info = "") => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${info ? `  (${info})` : ""}`); };
const b = await chromium.launch();

// ---- keyboard through the Work index
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); sessionStorage.setItem("jvr.spotlight", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.bringToFront();
  await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "home", null, { timeout: 20000 });
  await p.getByRole("button", { name: "[Work]" }).click();
  await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "work", null, { timeout: 15000 });
  await p.waitForTimeout(1300);

  // Tabbed to, not focus()ed: :focus-visible only answers to the keyboard.
  await p.locator(".work-index__row").first().focus();
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Tab");
  const ring = await p.evaluate(() => {
    const el = document.activeElement;
    const s = getComputedStyle(el);
    return { cls: el.className, visible: el.matches(":focus-visible"), outline: s.outlineStyle !== "none" && s.outlineWidth !== "0px" };
  });
  pass("the index takes focus, visibly", ring.cls.includes("work-index__row") && ring.outline && ring.visible, JSON.stringify(ring));

  const before = await p.textContent(".work-info__title");
  await p.keyboard.press("ArrowDown");
  await p.waitForTimeout(1200);
  const after = await p.textContent(".work-info__title");
  pass("arrow keys move the surface", before !== after, `${before} -> ${after}`);
  pass("focus follows the selection", await p.evaluate(() => document.activeElement?.hasAttribute("data-current")));

  const aria = await p.evaluate(() => ({
    current: document.querySelectorAll('.work-index__row[aria-current="true"]').length,
    ctls: [...document.querySelectorAll(".work-ctl")].map((n) => n.getAttribute("aria-label")),
  }));
  pass("one project is current", aria.current === 1, String(aria.current));
  pass("the controls say what they do", aria.ctls.join(", ") === "Previous project, Next project", aria.ctls.join(", "));

  // into a case study by keyboard
  await p.evaluate(() => {
    const rows = [...document.querySelectorAll(".work-index__t")].map((n) => n.textContent);
    const i = rows.indexOf("jorisvrr.com");
    document.querySelectorAll(".work-index__row")[i].click();
  });
  await p.waitForTimeout(1200);
  await p.getByRole("link", { name: /open case study/i }).focus();
  await p.keyboard.press("Enter");
  await p.waitForFunction(() => Boolean(document.querySelector(".case")), null, { timeout: 6000 });
  await p.waitForTimeout(600);
  const doc = await p.evaluate(() => ({
    h1: document.querySelectorAll(".case h1").length,
    h2: document.querySelectorAll(".case h2").length,
    nav: document.querySelector(".case-nav")?.getAttribute("aria-label"),
    expanded: document.querySelector(".dec__pick")?.getAttribute("aria-expanded"),
    controls: document.querySelector(".dec__pick")?.getAttribute("aria-controls"),
  }));
  pass("one h1, and a heading per section", doc.h1 === 1 && doc.h2 === 9, JSON.stringify(doc));
  pass("the section index is labelled", doc.nav === "Sections", doc.nav ?? "");
  pass("decisions announce their state", doc.expanded === "true" && Boolean(doc.controls), `${doc.expanded} ${doc.controls}`);

  await p.keyboard.press("Escape");
  await p.waitForTimeout(700);
  pass("Escape leaves the case study", await p.evaluate(() => !document.querySelector(".case") && location.pathname === "/"));
  await ctx.close();
}

// ---- reduced motion
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/work/jorisvrr`, { waitUntil: "networkidle" });
  await p.bringToFront();
  await p.waitForTimeout(700);
  const still = await p.evaluate(() => {
    const anims = document.getAnimations().filter((a) => a.playState === "running");
    const s = document.querySelector(".case-section");
    return {
      running: anims.length,
      marked: Boolean(s?.hasAttribute("data-in")),
      opacity: getComputedStyle(document.querySelector(".case-prose")).opacity,
      hero: getComputedStyle(document.querySelector(".case-hero__media")).opacity,
    };
  });
  pass("nothing is animating", still.running === 0, `${still.running} running`);
  pass("every section is simply there", still.marked && still.opacity === "1" && still.hero === "1", JSON.stringify(still));
  await ctx.close();
}

console.log(fails ? `FAILS: ${fails}` : "all pass");
await b.close();
