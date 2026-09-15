import { chromium } from "playwright";
// About captures: home telemetry, home -> about, settled about, about -> home.
const OUT = process.argv[2];
const b = await chromium.launch();
const errs = [];
const p = await b.newPage({ viewport: { width: 1920, height: 950 } });
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); } catch {} });
await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.mouse.move(1500, 800);
await p.screenshot({ path: `${OUT}/ab-home.png` });

const shoot = async (name, times, t0) => {
  for (const at of times) {
    const w = at * 1000 - (Date.now() - t0);
    if (w > 0) await p.waitForTimeout(w);
    await p.screenshot({ path: `${OUT}/${name}-${at}.png` });
    console.log(name, at, await p.getAttribute(".experience", "data-state"));
  }
};
await p.getByRole("button", { name: "[About]" }).hover();
await p.waitForTimeout(300);
await p.getByRole("button", { name: "[About]" }).click();
await shoot("ab-in", [0.35, 0.8, 1.2, 1.6, 3.2], Date.now());
await p.mouse.move(1650, 820);
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/ab-settled.png` });
await p.getByRole("button", { name: "[Home]" }).click();
await shoot("ab-out", [0.4, 0.9, 1.4, 2.4], Date.now());
console.log("errors:", errs.length ? errs : "none");
await b.close();
