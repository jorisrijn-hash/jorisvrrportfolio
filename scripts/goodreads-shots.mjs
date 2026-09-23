import { chromium } from "playwright";

/**
 * Real media for the Goodreads case study, captured from the deployed
 * application (goodreads-rose.vercel.app) — the product as it actually runs.
 * Nothing here is a mockup.
 */
const OUT = process.argv[2] ?? "/tmp/gr";
const BASE = "https://goodreads-rose.vercel.app";
const b = await chromium.launch();
const shot = async (p, name, full = false) => {
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log("shot", name);
};
const page = async (w, h, mobile = false) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  p.setDefaultTimeout(90000);
  return p;
};

// ---- desktop
{
  const p = await page(1440, 900);
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  await shot(p, "d-landing");
  await p.goto(BASE + "/discover", { waitUntil: "networkidle" });
  await p.waitForTimeout(3500);
  await shot(p, "d-discover");
  // a typo the catalogue recovers — the "showing results for" path
  await p.goto(BASE + "/discover?q=fahrenhiet", { waitUntil: "networkidle" });
  await p.waitForTimeout(4000);
  await shot(p, "d-search-typo");
  // a book detail page: take the first result's link from discover
  await p.goto(BASE + "/discover", { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
  const href = await p.evaluate(() => document.querySelector('a[href^="/book/"]')?.getAttribute("href"));
  console.log("book:", href);
  if (href) {
    await p.goto(BASE + href, { waitUntil: "networkidle" });
    await p.waitForTimeout(3000);
    await shot(p, "d-book");
  }
  // the demo account: sign in with one click, then home and library
  await p.goto(BASE + "/login", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await shot(p, "d-login");
  const demo = p.getByRole("button", { name: /demo/i }).first();
  if (await demo.count()) {
    await demo.click();
    await p.waitForTimeout(6000);
    await shot(p, "d-home");
    await p.goto(BASE + "/library", { waitUntil: "networkidle" });
    await p.waitForTimeout(4000);
    await shot(p, "d-library");
  }
  await p.context().close();
}

// ---- phone
{
  const p = await page(390, 844, true);
  await p.goto(BASE + "/discover", { waitUntil: "networkidle" });
  await p.waitForTimeout(4000);
  await shot(p, "m-discover");
  const href = await p.evaluate(() => document.querySelector('a[href^="/book/"]')?.getAttribute("href"));
  if (href) {
    await p.goto(BASE + href, { waitUntil: "networkidle" });
    await p.waitForTimeout(3000);
    await shot(p, "m-book");
  }
  await p.context().close();
}
await b.close();
