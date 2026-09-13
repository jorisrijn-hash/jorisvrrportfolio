import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-joris-dev-portfolio/678195c8-3b68-4c2c-8c62-be0fb64c74c6/scratchpad";
const base = "http://localhost:4311";
const browser = await chromium.launch();

const errors = [];
async function shot(page, url, name, opts = {}) {
  await page.goto(base + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(opts.wait ?? 2600);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: !!opts.full });
}

// Desktop
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(`[${page.url()}] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

// Intro at ~0.5s, mid-assembly
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/01-intro-building.png` });
await page.waitForTimeout(1400);
await page.screenshot({ path: `${OUT}/02-intro-choice.png` });

// Enter silently, then the hero
const silent = page.getByRole("button", { name: /enter silently/i });
if (await silent.count()) await silent.click();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/03-hero.png` });

// Full homepage
await page.screenshot({ path: `${OUT}/04-home-full.png`, fullPage: true });

// Menu open
await page.getByRole("button", { name: /^menu/i }).click();
await page.waitForTimeout(1300);
await page.screenshot({ path: `${OUT}/05-menu.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(800);

for (const [url, name] of [["/work","06-work"],["/lab","07-lab"],["/profile","08-profile"],["/contact","09-contact"]]) {
  await shot(page, url, name, { full: true, wait: 2000 });
}

// Mobile
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mp = await m.newPage();
mp.on("pageerror", (e) => errors.push(`[mobile pageerror] ${e.message}`));
await mp.goto(base + "/", { waitUntil: "networkidle" });
await mp.waitForTimeout(2200);
const s2 = mp.getByRole("button", { name: /enter silently/i });
if (await s2.count()) await s2.click();
await mp.waitForTimeout(1500);
await mp.screenshot({ path: `${OUT}/10-mobile-hero.png` });
await mp.screenshot({ path: `${OUT}/11-mobile-full.png`, fullPage: true });
await mp.getByRole("button", { name: /^menu/i }).click();
await mp.waitForTimeout(1300);
await mp.screenshot({ path: `${OUT}/12-mobile-menu.png` });

console.log(errors.length ? "CONSOLE ERRORS:\n" + errors.join("\n") : "No console/page errors.");
await browser.close();
