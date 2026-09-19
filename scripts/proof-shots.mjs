import { chromium } from "playwright";

/**
 * HOME -> SOCIAL PROOF, frame by frame at fixed scroll progress, down and
 * back up. node scripts/proof-shots.mjs <outdir>
 */
const OUT = process.argv[2] ?? "shots/proof";
const PTS = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1];
const b = await chromium.launch();
for (const [name, vw, vh, dpr, mobile] of [["desk", 1440, 900, 1, false], ["phone", 390, 844, 2, true]]) {
  const p = await (await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile })).newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await p.goto("http://localhost:4311/?preview=proof", { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
  const to = async (f) => {
    await p.locator(".proof-scroll").evaluate((el, f) => el.scrollTo({ top: f * (el.scrollHeight - el.clientHeight), behavior: "instant" }), f);
    await p.waitForTimeout(900);
  };
  for (const f of PTS) { await to(f); await p.screenshot({ path: `${OUT}/${name}-${String(f).replace(".", "")}.png` }); }
  await to(0);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${name}-back0.png` });
  const info = await p.evaluate(() => ({
    cards: document.querySelectorAll(".proof-card").length,
    lanes: document.querySelectorAll(".proof-lane").length,
    placeholderTags: document.querySelectorAll(".proof-card__ph").length,
    spacer: document.querySelector(".proof-scroll__spacer")?.getBoundingClientRect().height,
  }));
  console.log(name, JSON.stringify(info), errs.length ? errs : "no errors");
}
await b.close();
