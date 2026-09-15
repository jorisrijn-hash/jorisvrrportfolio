import { chromium } from "playwright";
// Captures the connected moves: work -> home, work -> about, about -> work.
const OUT = process.argv[2];
const b = await chromium.launch();
const errs = [];
const p = await b.newPage({ viewport: { width: 1920, height: 950 } });
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); } catch {} });
await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const state = () => p.getAttribute(".experience", "data-state");
const run = async (label, button, times) => {
  await p.mouse.move(1500, 860);
  await p.getByRole("button", { name: button }).click();
  const t0 = Date.now();
  for (const at of times) {
    const w = at * 1000 - (Date.now() - t0);
    if (w > 0) await p.waitForTimeout(w);
    await p.screenshot({ path: `${OUT}/${label}-${at}.png` });
    console.log(label, at, "real", ((Date.now() - t0) / 1000).toFixed(2), await state());
  }
};
await run("h2w", "[Work]", [3.4]);
await run("w2h", "[Home]", [0.05, 0.3, 0.6, 0.95, 1.6]);
await run("h2w-again", "[Work]", [3.4]);
await run("w2a", "[About]", [0.3, 0.7, 1.1, 1.45, 2.7]);
await run("a2w", "[Work]", [0.05, 0.45, 0.9, 1.35, 2.3]);
console.log("errors:", errs.length ? errs : "none");
await b.close();
