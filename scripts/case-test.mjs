import { chromium } from "playwright";

/**
 * CASE STUDIES — the route, the transition, and what is actually rendered.
 *
 *   open      the Work surface becomes the hero; the URL moves, the page does not
 *   sections  only sections the project has, and an index generated from them
 *   close     back (and Escape) return to the environment, still settled
 *   direct    /work/<slug> renders the same case study by itself
 *   absent    a project with no case study is not given an empty page
 */
const OUT = process.argv[2] ?? "/tmp";
const BASE = "http://localhost:4311";
let fails = 0;
const pass = (n, ok, info = "") => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${info ? `  (${info})` : ""}`); };
const b = await chromium.launch();
const errs = [];
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });
await p.addInitScript(() => {
  try { sessionStorage.setItem("jvr.booted", "1"); sessionStorage.setItem("jvr.spotlight", "1"); localStorage.setItem("jvr.sound", "off"); } catch {}
});
await p.goto(BASE + "/", { waitUntil: "networkidle" });
await p.bringToFront();
await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "home", null, { timeout: 20000 });
await p.getByRole("button", { name: "[Work]" }).click();
await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "work", null, { timeout: 15000 });
await p.waitForTimeout(1300);

// a marker that only survives if the document is never reloaded
await p.evaluate(() => { window.__same = true; });

// ---- to the project that has a case study, then open it
const rows = p.locator(".work-index__row");
const names = await p.evaluate(() => [...document.querySelectorAll(".work-index__t")].map((n) => n.textContent));
await rows.nth(names.indexOf("jorisvrr.com")).click();
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/case-0-work.png` });

const t0 = Date.now();
await p.getByRole("link", { name: /open case study/i }).click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/case-1-handover.png` });
await p.waitForFunction(() => Boolean(document.querySelector(".case")), null, { timeout: 5000 });
const opened = Date.now() - t0;
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/case-2-hero.png` });

pass("the page never reloaded", await p.evaluate(() => window.__same === true));
pass("the URL moved to the case study", new URL(p.url()).pathname === "/work/jorisvrr", p.url());
pass("the hero takes over after the move", opened >= 600 && opened <= 1400, `${opened}ms`);
pass("the environment is still mounted behind it", await p.evaluate(() => Boolean(document.querySelector(".work"))));
pass("the sculpture stops drawing", await p.evaluate(() => getComputedStyle(document.querySelector(".sculpture")).display === "none"));

// ---- the sections are the ones this project has
const shape = await p.evaluate(() => ({
  sections: [...document.querySelectorAll(".case-section")].map((s) => s.dataset.section),
  nav: [...document.querySelectorAll(".case-nav a")].map((a) => a.textContent.replace(/^\d+/, "")),
  empty: [...document.querySelectorAll(".case-section")].filter((s) => s.children.length < 2).map((s) => s.dataset.section),
  decisions: document.querySelectorAll(".dec__item").length,
  code: document.querySelectorAll(".code").length,
  chrome: document.querySelectorAll(".code [class*='traffic'], .code [class*='dot']").length,
  log: document.querySelectorAll(".log__entry").length,
  metrics: document.querySelectorAll(".result__metrics > div").length,
  sources: [...document.querySelectorAll(".result__source")].every((n) => n.textContent.trim().length > 3),
  nodes: document.querySelectorAll(".dgm__node").length,
  entities: document.querySelectorAll(".dmodel__entity").length,
}));
console.log("sections:", shape.sections.join(", "));
pass("no empty section is rendered", shape.empty.length === 0, shape.empty.join(",") || "none");
pass("the index matches the sections", shape.nav.length === shape.sections.length, `${shape.nav.length} / ${shape.sections.length}`);
pass("the diagram is drawn from the graph", shape.nodes === 9, `${shape.nodes} nodes`);
pass("the data model renders its entities", shape.entities === 6, `${shape.entities}`);
pass("decisions are there", shape.decisions === 6, `${shape.decisions}`);
pass("code has no editor chrome", shape.code === 2 && shape.chrome === 0, `${shape.code} blocks`);
pass("the dev log is there", shape.log === 2, `${shape.log}`);
pass("every metric carries its source", shape.metrics === 5 && shape.sources, `${shape.metrics}`);

// ---- reading down it
await p.evaluate(() => document.querySelector(".case").scrollTo({ top: 1500, behavior: "instant" }));
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}/case-3-read.png` });
await p.evaluate(() => { const el = document.querySelector("#architecture"); el?.scrollIntoView(); });
await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/case-4-architecture.png` });
await p.evaluate(() => { document.querySelector("#decisions")?.scrollIntoView(); });
await p.waitForTimeout(700);
await p.locator(".dec__pick").nth(4).click();
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}/case-5-decisions.png` });
await p.evaluate(() => { document.querySelector("#code")?.scrollIntoView(); });
await p.waitForTimeout(800);
await p.screenshot({ path: `${OUT}/case-6-code.png` });
await p.evaluate(() => { document.querySelector("#challenges")?.scrollIntoView(); });
await p.waitForTimeout(800);
await p.screenshot({ path: `${OUT}/case-7-log.png` });
await p.evaluate(() => { const c = document.querySelector(".case"); c.scrollTo({ top: c.scrollHeight, behavior: "instant" }); });
await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/case-8-next.png` });
const nav = await p.evaluate(() => document.querySelector(".case-nav a[data-current]")?.textContent ?? "");
pass("the index follows the reading", nav.length > 0, nav);

// ---- back returns to the environment
await p.goBack();
await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/case-9-back.png` });
const back = await p.evaluate(() => ({
  url: location.pathname,
  same: window.__same === true,
  work: Boolean(document.querySelector(".work")),
  gone: !document.querySelector(".case"),
  solid: document.querySelector(".work")?.hasAttribute("data-solid"),
  title: document.querySelector(".work-info__title")?.textContent,
}));
pass("back closes the case study", back.gone && back.url === "/", JSON.stringify(back.url));
pass("the environment is still where it was", back.same && back.work && back.solid === true, back.title ?? "");

// ---- a direct URL
const p2 = await ctx.newPage();
p2.on("pageerror", (e) => errs.push(String(e)));
await p2.goto(`${BASE}/work/jorisvrr`, { waitUntil: "networkidle" });
await p2.bringToFront();
await p2.waitForTimeout(1400);
await p2.screenshot({ path: `${OUT}/case-10-direct.png` });
const direct = await p2.evaluate(() => ({
  case: Boolean(document.querySelector(".case")),
  arrival: document.querySelector(".case")?.dataset.arrival,
  env: Boolean(document.querySelector(".sculpture")),
  title: document.querySelector(".case-hero__title")?.textContent,
  back: document.querySelector(".case-back")?.getAttribute("href"),
}));
pass("a direct URL renders the case study", direct.case && direct.title === "jorisvrr.com", JSON.stringify(direct.title));
pass("it arrives by itself, shortened", direct.arrival === "direct" && !direct.env, direct.arrival);
pass("and it can get back to the work", direct.back === "/", direct.back ?? "");

// ---- a project with no case study is not given an empty page
const p3 = await ctx.newPage();
await p3.goto(`${BASE}/work/bebo`, { waitUntil: "networkidle" });
await p3.waitForTimeout(600);
pass("no case study, no empty page", new URL(p3.url()).pathname === "/", p3.url());

console.log("errors:", errs.length ? errs.slice(0, 4) : "none");
console.log(fails ? `FAILS: ${fails}` : "all pass");
await b.close();
