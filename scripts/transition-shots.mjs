import { chromium } from "playwright";
const OUT = process.argv[2];
const b = await chromium.launch();
const errs = [];
// A. returning visitor -> home pose directly
{
  const p = await b.newPage({ viewport: { width: 1920, height: 950 } });
  p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  p.on("pageerror", e => errs.push(String(e)));
  await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); } catch {} });
  await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/home-now.png` });
  console.log("state", await p.getAttribute(".experience", "data-state"),
    "paths", await p.locator(".sculpture path").count());
  await p.close();
}
// B. full transition
{
  const p = await b.newPage({ viewport: { width: 1920, height: 950 } });
  p.on("pageerror", e => errs.push(String(e)));
  await p.addInitScript(() => { try { sessionStorage.removeItem("jvr.booted"); } catch {} });
  await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.getByRole("button", { name: /^off$/i }).click();
  await p.waitForSelector(".sculpture", { state: "attached", timeout: 15000 });
  const t0 = Date.now();
  for (const at of [0.3, 0.7, 1.0, 1.2, 1.45, 1.7, 2.0, 2.4, 3.2]) {
    const wait = at * 1000 - (Date.now() - t0);
    if (wait > 0) await p.waitForTimeout(wait);
    const real = ((Date.now() - t0) / 1000).toFixed(2);
    await p.screenshot({ path: `${OUT}/xf-${at}.png` });
    console.log("shot", at, "real", real, await p.getAttribute(".experience", "data-state"));
  }
  await p.close();
}
console.log("errors:", errs.length ? errs : "none");
await b.close();
