import { chromium } from "playwright";

/**
 * PROJECT SWITCHING — behaviour inside the Work environment.
 *
 *   switch     the arrows and the index move the surface to another project
 *   identity   the environment is not rebuilt: the same .work node throughout
 *   phases     release -> media -> geometry -> resolve, inside 650-1100ms
 *   refuse     a second switch mid-switch is ignored, like nav mid-move
 *   empty      a project with nothing to show says so, and opens nothing
 */
const OUT = process.argv[2] ?? "/tmp";
let fails = 0;
const pass = (n, ok, info = "") => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${info ? `  (${info})` : ""}`); };
const b = await chromium.launch();
const errs = [];
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.addInitScript(() => {
  try { sessionStorage.setItem("jvr.booted", "1"); sessionStorage.setItem("jvr.spotlight", "1"); localStorage.setItem("jvr.sound", "off"); } catch {}
});
await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
await p.bringToFront();
// the session flag skips the gate; wait for Home itself
await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "home", null, { timeout: 20000 });
await p.waitForTimeout(1200);
await p.getByRole("button", { name: "[Work]" }).click();
await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "work", null, { timeout: 15000 });
await p.waitForTimeout(1200);

const title = () => p.textContent(".work-info__title");
const mark = () => p.evaluate(() => document.querySelector(".work")?.__id);
await p.evaluate(() => { document.querySelector(".work").__id = "the-one"; });

const first = await title();
await p.screenshot({ path: `${OUT}/switch-0-before.png` });

// ---- the phases, recorded from the page itself
await p.evaluate(() => {
  window.__ph = [];
  const el = document.querySelector(".work");
  const t0 = performance.now();
  window.__t0 = t0;
  new MutationObserver(() => {
    window.__ph.push({
      t: Math.round(performance.now() - t0),
      swap: el.hasAttribute("data-swap"),
      swapin: el.hasAttribute("data-swapin"),
      solid: el.hasAttribute("data-solid"),
      title: document.querySelector(".work-info__title")?.textContent,
    });
  }).observe(el, { attributes: true, attributeFilter: ["data-swap", "data-swapin", "data-solid"] });
});
await p.getByRole("button", { name: "Next project" }).click();
await p.waitForTimeout(1500);

const ph = await p.evaluate(() => window.__ph);
const second = await title();
const out = ph.find((x) => x.swap && !x.swapin);
const into = ph.find((x) => x.swapin);
const done = ph.find((x) => x.solid && x.t > 200);

pass("next moves the surface", second && second !== first, `${first} -> ${second}`);
pass("the environment is not rebuilt", (await mark()) === "the-one");
pass("release hands back to the cells", Boolean(out) && !out.solid, out && `t=${out.t}ms`);
pass("geometry closes after the media", Boolean(into) && into.t >= 300 && into.t <= 520, into && `t=${into.t}ms`);
pass("sealed again inside 650-1100ms", Boolean(done) && done.t >= 650 && done.t <= 1100, done && `t=${done.t}ms`);
const after = await p.evaluate(() => {
  const el = document.querySelector(".work");
  return { solid: el.hasAttribute("data-solid"), swap: el.hasAttribute("data-swap"), cells: getComputedStyle(document.querySelector(".work-cells")).display };
});
pass("idle costs one layer again", after.solid && !after.swap && after.cells === "none", JSON.stringify(after));

// ---- a second ask, mid-switch: ignored, exactly like nav mid-move
{
  const before = await title();
  // Dispatched from inside the page: three asks 120ms apart, so the second
  // and third really do land mid-switch (a driven click can take longer).
  await p.evaluate(async () => {
    const btn = [...document.querySelectorAll(".work-ctl")].find((b) => b.getAttribute("aria-label") === "Next project");
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    btn.click(); await wait(120); btn.click(); await wait(120); btn.click();
  });
  await p.waitForTimeout(1400);
  const now = await title();
  const names = await p.evaluate(() => [...document.querySelectorAll(".work-index__t")].map((n) => n.textContent));
  const step = (names.indexOf(now) - names.indexOf(before) + names.length) % names.length;
  pass("a switch mid-switch is refused", step === 1, `${before} -> ${now} (moved ${step})`);
}

// ---- the phases, on screen
{
  await p.evaluate(() => { window.__shot = []; });
  const t0 = Date.now();
  await p.getByRole("button", { name: "Previous project" }).click();
  for (const [at, name] of [[170, "1-release"], [430, "2-media"], [760, "3-resolve"]]) {
    const w = at - (Date.now() - t0);
    if (w > 0) await p.waitForTimeout(w);
    await p.screenshot({ path: `${OUT}/switch-${name}.png` });
  }
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/switch-4-after.png` });
}

// ---- the index selects directly, and the empty project is honest
const rows = p.locator(".work-index__row");
const n = await rows.count();
await rows.nth(n - 1).click();
await p.waitForTimeout(1100);
await p.screenshot({ path: `${OUT}/switch-5-comingsoon.png` });
const last = await p.evaluate(() => ({
  title: document.querySelector(".work-info__title")?.textContent,
  empty: document.querySelector(".work")?.hasAttribute("data-empty"),
  soon: document.querySelector(".work-soon")?.textContent,
  cta: document.querySelector(".work-cta__open")?.tagName,
  ctaText: document.querySelector(".work-cta__open")?.textContent,
  current: document.querySelector(".work-index__row[data-current] .work-index__t")?.textContent,
}));
pass("the index selects directly", last.current === last.title, `${last.current}`);
pass("nothing to show says so", last.empty === true && /coming soon/i.test(last.soon ?? ""), last.soon);
pass("coming soon opens nothing", last.cta === "P" && /coming soon/i.test(last.ctaText ?? ""), last.ctaText);

// ---- back to a project with a case study
await rows.nth(0).click();
await p.waitForTimeout(1100);
const cta = await p.evaluate(() => {
  const a = document.querySelector("a.work-cta__open");
  return a ? a.getAttribute("href") : null;
});
console.log("cta on 01:", cta ?? "(none — no case study yet)");
console.log("errors:", errs.length ? errs : "none");
console.log(fails ? `FAILS: ${fails}` : "all pass");
await b.close();
