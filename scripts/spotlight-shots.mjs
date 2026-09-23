import { chromium } from "playwright";

/** The notification's entrance, its close, and the move into Work. */
const OUT = process.argv[2] ?? "/tmp";
const b = await chromium.launch();
const open = async (w, h, mobile = false) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await p.goto("http://localhost:4311/", { waitUntil: "networkidle" });
  await p.bringToFront();
  await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "home", null, { timeout: 25000 });
  return p;
};

// ---- desktop: home, then the entrance frame by frame
{
  const p = await open(1600, 950);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/a-home-idle.png` });
  const t0 = Date.now();
  await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "to-spotlight", null, { timeout: 20000 });
  const start = Date.now();
  for (const [at, n] of [[220, "b-in-220"], [600, "c-in-600"], [1000, "d-in-1000"], [1500, "e-in-1500"]]) {
    const w = at - (Date.now() - start);
    if (w > 0) await p.waitForTimeout(w);
    await p.screenshot({ path: `${OUT}/${n}.png` });
  }
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/f-settled.png` });
  console.log("entrance began", start - t0, "ms after home");
  // close
  const c = Date.now();
  await p.click(".sp__close");
  for (const [at, n] of [[220, "g-close-220"], [600, "h-close-600"]]) {
    const w = at - (Date.now() - c);
    if (w > 0) await p.waitForTimeout(w);
    await p.screenshot({ path: `${OUT}/${n}.png` });
  }
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/i-home-after.png` });
  console.log("after close:", await p.getAttribute(".experience", "data-state"));
  await p.context().close();
}

// ---- desktop: the move into Work
{
  const p = await open(1600, 950);
  await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "spotlight", null, { timeout: 25000 });
  await p.waitForTimeout(900);
  const t = Date.now();
  await p.click(".sp__cta[data-primary]");
  for (const [at, n] of [[260, "j-work-260"], [620, "k-work-620"], [1000, "l-work-1000"], [1800, "m-work-1800"]]) {
    const w = at - (Date.now() - t);
    if (w > 0) await p.waitForTimeout(w);
    await p.screenshot({ path: `${OUT}/${n}.png` });
  }
  await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "work", null, { timeout: 20000 });
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/n-work.png` });
  await p.context().close();
}

// ---- phone
{
  const p = await open(390, 844, true);
  await p.waitForFunction(() => document.querySelector(".experience")?.dataset.state === "spotlight", null, { timeout: 25000 });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/o-phone.png` });
  await p.context().close();
}
console.log("shots done");
await b.close();
