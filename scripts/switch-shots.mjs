import { chromium } from "playwright";

/** The project switch, frame by frame, forward and back. */
const OUT = process.argv[2] ?? "/tmp";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1600, height: 950 } });
const p = await ctx.newPage();
await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); sessionStorage.setItem("jvr.spotlight", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
await p.bringToFront();
await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "home", null, { timeout: 25000 });
await p.getByRole("button", { name: "[Work]" }).click();
await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "work", null, { timeout: 20000 });
await p.waitForTimeout(1600);
await p.screenshot({ path: `${OUT}/s0-before.png` });

const run = (label, dir) => (async () => {
  const t = Date.now();
  await p.evaluate((d) => document.querySelector(`[aria-label="${d} project"]`).click(), dir);
  for (const at of [140, 300, 420, 560, 760, 1000]) {
    const w = at - (Date.now() - t);
    if (w > 0) await p.waitForTimeout(w);
    await p.screenshot({ path: `${OUT}/${label}-${at}.png` });
  }
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/${label}-done.png` });
})();

await run("next", "Next");
await p.waitForTimeout(700);
await run("prev", "Previous");
console.log("done");
await b.close();
