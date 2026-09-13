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
  await p.waitForTimeout(800);
  pass("first visit: boot plays", (await p.locator(".boot").count()) === 1);
  pass("resting furniture hidden during boot",
       (await p.getAttribute(".resting", "data-resolved")) === "false");
  await p.waitForTimeout(11200);
  pass("boot completes and unmounts", (await p.locator(".boot").count()) === 0);
  pass("state is home", (await p.getAttribute(".experience", "data-state")) === "home");
  pass("resting furniture resolved",
       (await p.getAttribute(".resting", "data-resolved")) === "true");
  await ctx.close();
}

// 3. RETURNING VISITOR
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950} })).newPage();
  await p.addInitScript(seen);
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(700);
  pass("returning in session: boot skipped", (await p.locator(".boot").count()) === 0);
  pass("lands straight on home", (await p.getAttribute(".experience","data-state")) === "home");
  await p.context().close();
}

// 4. REDUCED MOTION
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950}, reducedMotion:"reduce" })).newPage();
  await p.addInitScript(fresh);
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(900);
  pass("reduced motion: boot skipped", (await p.locator(".boot").count()) === 0);
  pass("reduced motion: composition still present", (await p.locator(".centre").count()) === 1);
  await p.context().close();
}

// 5. SOUND CONSENT
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950} })).newPage();
  await p.addInitScript(seen);
  await p.addInitScript(() => {
    window.__ac = 0;
    const O = window.AudioContext;
    window.AudioContext = class extends O { constructor(...a){ super(...a); window.__ac++; } };
  });
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(1500);
  pass("no AudioContext before consent", !(await p.evaluate(()=>window.__ac>0)));
  const t = p.getByRole("button", { name: /turn sound on/i });
  pass("sound toggle present and labelled", (await t.count()) === 1);
  await t.click();
  await p.waitForTimeout(500);
  pass("AudioContext only after consent", await p.evaluate(()=>window.__ac>0));
  pass("toggle reflects state", (await p.getByRole("button",{name:/turn sound off/i}).count()) === 1);
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
  pass("boot track NOT fetched without consent", audioReqs.length === 0, audioReqs[0] ?? "");
  await p.context().close();
}
await b.close();
