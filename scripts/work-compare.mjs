import { chromium } from "playwright";
// Captures home -> featured work at the comparison points (seconds from click).
const OUT = process.argv[2];
const TIMES = [0.0, 0.65, 1.3, 1.5, 1.95, 2.6, 3.4];
const b = await chromium.launch();
const errs = [];
const p = await b.newPage({ viewport: { width: 1920, height: 950 } });
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); } catch {} });
await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
await p.getByRole("button", { name: "[Work]" }).hover();
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/ours-0.0.png` });
await p.getByRole("button", { name: "[Work]" }).click();
const t0 = Date.now();
for (const at of TIMES.slice(1)) {
  const w = at * 1000 - (Date.now() - t0);
  if (w > 0) await p.waitForTimeout(w);
  await p.screenshot({ path: `${OUT}/ours-${at}.png` });
  console.log("shot", at, "real", ((Date.now() - t0) / 1000).toFixed(2), await p.getAttribute(".experience", "data-state"));
}
await p.mouse.move(600, 400, { steps: 5 });
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/ours-view.png` });
console.log("cursor over media:", await p.getAttribute(".cursor", "data-state"));
console.log("errors:", errs.length ? errs : "none");
await b.close();
