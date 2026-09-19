import { chromium } from "playwright";

/**
 * ABOUT, scrolled — the opening composition, the page below it, the globe's
 * morph at each depth, a channel lighting its node, and one VHS pass caught
 * mid-flight. Screenshots only; the assertions live in verify-a11y.mjs.
 */
const OUT = process.argv[2] ?? "shots/about-scroll";
const SIZES = [
  { name: "desk", width: 1920, height: 950 },
  { name: "lap", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844, mobile: true },
];

const b = await chromium.launch();
for (const sz of SIZES) {
  const ctx = await b.newContext({
    viewport: { width: sz.width, height: sz.height },
    deviceScaleFactor: 1,
    isMobile: !!sz.mobile,
    hasTouch: !!sz.mobile,
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);

  // one VHS pass, caught in the middle
  await p.getByRole("button", { name: "[About]" }).first().click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/${sz.name}-vhs.png` });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: `${OUT}/${sz.name}-0-open.png` });

  const sc = p.locator(".about__scroll");
  const depths = sz.mobile ? [900, 1500, 2100, 2700, 99999] : [0.5, 1.0, 1.6, 2.2, 99999];
  let i = 1;
  for (const d of depths) {
    await sc.evaluate((el, d) => { el.scrollTo({ top: d < 100 ? d * innerHeight : d, behavior: "instant" }); }, d);
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${OUT}/${sz.name}-${i++}-scroll.png` });
  }
  // a channel row under the pointer
  if (!sz.mobile) {
    await p.locator(".about__link").first().hover();
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/${sz.name}-links-hover.png` });
  }
  const info = await p.evaluate(() => ({
    scrollH: document.querySelector(".about__scroll").scrollHeight,
    links: [...document.querySelectorAll(".about__link")].map((a) => [a.textContent, a.getAttribute("target"), a.getAttribute("rel")]),
    hot: document.querySelectorAll(".about__node[data-hot]").length,
    net: document.querySelector(".about__net").getAttribute("opacity"),
    bodyScrollX: document.documentElement.scrollWidth > innerWidth,
  }));
  console.log(sz.name, JSON.stringify(info), errs.length ? errs : "no errors");

  // leaving from the bottom: cut to the top under the tear
  await p.keyboard.press("Escape");
  await p.waitForTimeout(160);
  await p.screenshot({ path: `${OUT}/${sz.name}-leave-cut.png` });
  await p.waitForTimeout(2200);
  console.log(sz.name, "after leave:", await p.getAttribute(".experience", "data-state"));
  await ctx.close();
}
await b.close();
