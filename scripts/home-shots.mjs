import { chromium } from "playwright";
// Home interaction captures: top bar spacing, cursor tilt, hover, fake crash.
const OUT = process.argv[2];
const b = await chromium.launch();
const errs = [];
const p = await b.newPage({ viewport: { width: 1920, height: 950 } });
p.on("pageerror", (e) => errs.push(String(e)));
await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); } catch {} });
await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/h-topbar.png`, clip: { x: 0, y: 0, width: 1920, height: 80 } });

await p.mouse.move(60, 900, { steps: 8 });
await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/h-tilt-bl.png` });
await p.mouse.move(1860, 120, { steps: 8 });
await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/h-tilt-tr.png` });

// sweep until an asset reports hover
let hovered = null;
for (const [x, y] of [[960, 470], [1000, 480], [930, 440], [1180, 480], [760, 580]]) {
  await p.mouse.move(x, y, { steps: 6 });
  await p.waitForTimeout(500);
  if ((await p.evaluate(() => document.documentElement.hasAttribute("data-sculpt-hover")))) { hovered = [x, y]; break; }
}
console.log("hover detected at", hovered);
await p.screenshot({ path: `${OUT}/h-hover.png` });
await p.mouse.move(40, 470, { steps: 4 });
await p.waitForTimeout(500);
console.log("hover cleared off asset", !(await p.evaluate(() => document.documentElement.hasAttribute("data-sculpt-hover"))));

await p.getByRole("button", { name: /rebuild/i }).click();
const t0 = Date.now();
for (const at of [0.2, 0.7, 1.1, 1.7, 2.6]) {
  const w = at * 1000 - (Date.now() - t0);
  if (w > 0) await p.waitForTimeout(w);
  await p.screenshot({ path: `${OUT}/c-${at}.png` });
  console.log("crash shot", at, await p.getAttribute(".experience", "data-state"));
}
console.log("errors:", errs.length ? errs : "none");
await b.close();
