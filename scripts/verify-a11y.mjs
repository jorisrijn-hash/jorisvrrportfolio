import { chromium } from "playwright";
const base = "http://localhost:4311";
const b = await chromium.launch();
const pass = (n, c, x = "") => console.log(`${c ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`);
const fresh = () => { try { sessionStorage.removeItem("jvr.booted"); } catch {} };
const seen  = () => { try { sessionStorage.setItem("jvr.booted", "1"); } catch {} };

// 1. HARD RULE — no reference media may ever render
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950} })).newPage();
  await p.addInitScript(fresh);
  const blocked = [];
  p.on("request", r => { if (/\.(mp4|webm|mov)(\?|$)/i.test(r.url())) blocked.push(r.url()); });
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const dom = await p.evaluate(() => ({
    v: document.querySelectorAll("video").length,
    c: document.querySelectorAll("canvas").length,
  }));
  pass("no <video> anywhere", dom.v === 0);
  pass("no <canvas> anywhere", dom.c === 0);
  pass("no video ever requested", blocked.length === 0, blocked[0] ?? "");
  await p.context().close();
}

// 2. BOOT gating
{
  const ctx = await b.newContext({ viewport:{width:1920,height:950} });
  const p = await ctx.newPage();
  await p.addInitScript(fresh);
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(700);
  pass("first visit: audio gate shown", (await p.locator(".gate").count()) === 1);
  pass("boot waits for the choice", (await p.locator(".boot").count()) === 0);
  await p.getByRole("button", { name: /^on$/i }).click();
  await p.waitForTimeout(600);
  pass("choosing starts the sequence", (await p.locator(".boot").count()) === 1);
  pass("resting furniture hidden during boot",
       (await p.getAttribute(".resting", "data-resolved")) === "false");
  await p.waitForTimeout(11200);
  pass("boot completes and unmounts", (await p.locator(".boot").count()) === 0);
  pass("hands over to loading-to-home", (await p.getAttribute(".experience", "data-state")) === "loading-to-home");
  pass("the sculpture takes over the centre", (await p.locator(".sculpture").count()) === 1
       && (await p.locator(".centre").count()) === 0);
  pass("input refused mid-transition",
       await p.getByRole("button", { name: /rebuild/i }).isDisabled());
  pass("resting furniture resolved",
       (await p.getAttribute(".resting", "data-resolved")) === "true");
  await p.waitForTimeout(3000);
  pass("transition arrives in home", (await p.getAttribute(".experience", "data-state")) === "home");
  pass("interface resolved", (await p.getAttribute(".experience", "data-x-ui")) !== null);
  pass("rebuild available again",
       !(await p.getByRole("button", { name: /rebuild/i }).isDisabled()));

  // [REBUILD] fakes a crash, then restarts the sequence without the gate
  await p.getByRole("button", { name: /rebuild/i }).click();
  await p.waitForTimeout(400);
  pass("rebuild crashes", (await p.getAttribute(".experience", "data-state")) === "crash");
  pass("crash takes the pointer", (await p.locator(".crash").count()) === 1);
  await p.waitForTimeout(2200);
  pass("crash reboots into the sequence", (await p.getAttribute(".experience", "data-state")) === "loading"
       && (await p.locator(".boot").count()) === 1 && (await p.locator(".gate").count()) === 0);
  await ctx.close();
}

// 3. RETURNING VISITOR
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950} })).newPage();
  await p.addInitScript(seen);
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(700);
  pass("returning in session: gate skipped", (await p.locator(".gate").count()) === 0);
  pass("returning in session: boot skipped", (await p.locator(".boot").count()) === 0);
  pass("lands straight on home", (await p.getAttribute(".experience","data-state")) === "home");
  pass("home composition drawn", (await p.locator(".sculpture path").count()) > 100);
  pass("home interface shown without transition", (await p.getAttribute(".experience","data-x-instant")) !== null);
  await p.context().close();
}

// 4. REDUCED MOTION
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950}, reducedMotion:"reduce" })).newPage();
  await p.addInitScript(fresh);
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(900);
  pass("reduced motion: gate skipped", (await p.locator(".gate").count()) === 0);
  pass("reduced motion: boot skipped", (await p.locator(".boot").count()) === 0);
  pass("reduced motion: composition still present", (await p.locator(".sculpture").count()) === 1);
  pass("reduced motion: lands on home", (await p.getAttribute(".experience","data-state")) === "home");
  await p.context().close();
}

// 4b. METADATA
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950} })).newPage();
  await p.goto(base, { waitUntil:"domcontentloaded" });
  const meta = await p.evaluate(() => ({
    title: document.title,
    og: document.querySelector('meta[property="og:image"]')?.getAttribute("content"),
    tw: document.querySelector('meta[name="twitter:card"]')?.getAttribute("content"),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    icon: [...document.querySelectorAll('link[rel~="icon"]')].map(l => l.getAttribute("href")),
  }));
  pass("title set", meta.title === "Joris van Rijn — ICT, Business & Digital Product", meta.title);
  pass("og:image points at the social preview", /og-image\.jpg/.test(meta.og ?? ""), meta.og);
  pass("twitter large card", meta.tw === "summary_large_image");
  pass("canonical", /jorisvrr\.com/.test(meta.canonical ?? ""), meta.canonical);
  pass("favicon linked", meta.icon.length > 0, meta.icon.join(" "));
  const og = await p.request.get(base + "/og-image.jpg");
  pass("social preview served", og.ok() && og.headers()["content-type"]?.includes("image"));
  await p.context().close();
}

// 5. SOUND CONSENT — the gate's answer is the gesture that unlocks audio
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950} })).newPage();
  await p.addInitScript(fresh);
  await p.addInitScript(() => {
    window.__ac = 0;
    const O = window.AudioContext;
    window.AudioContext = class extends O { constructor(...a){ super(...a); window.__ac++; } };
  });
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(1500);
  pass("no AudioContext at the gate", !(await p.evaluate(()=>window.__ac>0)));
  await p.getByRole("button",{name:/^on$/i}).click();     // the choice IS the gesture
  await p.waitForTimeout(700);
  pass("AudioContext only after the choice", await p.evaluate(()=>window.__ac>0));
  pass("toggle reflects the choice",
       (await p.getByRole("button",{name:/turn sound off/i}).count()) === 1);
  await p.context().close();
}

// 6. BOOT AUDIO CONSENT
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950} })).newPage();
  await p.addInitScript(fresh);
  const audioReqs = [];
  p.on("request", r => { if (/\/audio\//.test(r.url())) audioReqs.push(r.url()); });
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(2500);
  // Nothing may be audible while the gate is still asking.
  const playing = await p.evaluate(() =>
    [...document.querySelectorAll("audio")].some(a => !a.paused));
  pass("nothing audible while the gate is open", !playing);
  await p.context().close();
}
await b.close();
