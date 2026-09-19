import { chromium } from "playwright";

/**
 * HOME -> SOCIAL PROOF, behaviour. PASS/FAIL lines, like verify-a11y.mjs.
 *
 *   continuity   the core, followed as one object, moves without spikes
 *                through a full scroll down and back up
 *   reverse      progress returns to exactly 0 and Home's UI comes back
 *   vhs          one pass per crossing of the strongest window, none from
 *                jiggling inside it
 *   sound        the four milestone cues once going down, never repeated by
 *                jiggling on a threshold, not replayed on the way up
 *                (counted as bursts of real Web Audio node starts)
 *   navigation   [Work] from the proof glides Home back first; [Home] and
 *                Escape return to Home
 *   gate         production shows no proof without ?preview=proof
 */
const BASE = "http://localhost:4311/";
let fails = 0;
const pass = (name, ok, info = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? `  (${info})` : ""}`);
};

const b = await chromium.launch();

// ---- the gate: production, no preview -> no proof at all
{
  const p = await (await b.newContext()).newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  pass("gate: no proof in production without ?preview=proof", (await p.locator(".proof, .proof-scroll").count()) === 0);
  await p.context().close();
}

const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.addInitScript(() => {
  try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "on"); } catch {}
  // every real audio source start, timestamped: one cue = one burst
  window.__audio = [];
  for (const C of [window.OscillatorNode, window.AudioBufferSourceNode]) {
    const s = C.prototype.start;
    C.prototype.start = function (...a) { window.__audio.push(performance.now()); return s.apply(this, a); };
  }
});
await p.goto(BASE + "?preview=proof", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
// a real gesture unlocks audio
await p.mouse.click(700, 820);
await p.waitForTimeout(600);

const sc = p.locator(".proof-scroll");
const progress = () => sc.evaluate((el) => el.scrollTop / (el.scrollHeight - el.clientHeight));
const scrollTo = (f) => sc.evaluate((el, f) => el.scrollTo({ top: f * (el.scrollHeight - el.clientHeight), behavior: "instant" }), f);
const bursts = () => p.evaluate(() => {
  const t = window.__audio.slice().sort((a, b) => a - b);
  let n = 0, last = -1e9;
  for (const x of t) { if (x - last > 40) n++; last = x; }
  window.__audio = [];
  return n;
});
const vhsRuns = () => p.evaluate(() => { const n = window.__vhs ?? 0; window.__vhs = 0; return n; });
await p.evaluate(() => {
  window.__vhs = 0;
  new MutationObserver((m) => m.forEach((r) => { if (r.target.hasAttribute("data-run")) window.__vhs++; }))
    .observe(document.querySelector(".vhs"), { attributes: true, attributeFilter: ["data-run"] });
});
await bursts();

// ---- continuity: follow the core (the only 64-point polygon) per ms
await p.evaluate(() => {
  window.__tr = [];
  const svg = document.querySelector(".sculpture");
  const t = () => {
    for (const el of svg.querySelectorAll("path")) {
      const n = el.getAttribute("d")?.match(/-?\d+(?:\.\d+)?/g);
      if (!n || n.length !== 128) continue;
      let x = 0, y = 0, r = 0;
      for (let i = 0; i < 128; i += 2) { x += +n[i]; y += +n[i + 1]; }
      x /= 64; y /= 64;
      for (let i = 0; i < 128; i += 2) r += Math.hypot(+n[i] - x, +n[i + 1] - y);
      window.__tr.push([performance.now(), x, y, r / 64]);
      break;
    }
    window.__raf = requestAnimationFrame(t);
  };
  t();
});
for (let i = 1; i <= 24; i++) { await scrollTo(i / 24); await p.waitForTimeout(70); }
await p.waitForTimeout(1200);
const atEnd = await progress();
const downBursts = await bursts();
const downVhs = await vhsRuns();
for (let i = 23; i >= 0; i--) { await scrollTo(i / 24); await p.waitForTimeout(70); }
await p.waitForTimeout(1500);
const tr = await p.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__tr; });
const upBursts = await bursts();
const upVhs = await vhsRuns();

const v = [];
for (let i = 1; i < tr.length; i++) {
  const dt = tr[i][0] - tr[i - 1][0];
  if (dt > 0 && dt < 120) v.push([Math.hypot(tr[i][1] - tr[i - 1][1], tr[i][2] - tr[i - 1][2]) / dt, Math.abs(tr[i][3] - tr[i - 1][3]) / dt]);
}
const peak = Math.max(...v.map((x) => x[0]));
let worstA = 0;
for (let i = 1; i < v.length; i++) worstA = Math.max(worstA, Math.abs(v[i][0] - v[i - 1][0]));
pass("continuity: the core never jumps (peak velocity < 2 px/ms)", peak < 2, `peak ${peak.toFixed(3)} px/ms, worst Δv ${worstA.toFixed(3)}`);
pass("continuity: the core's size changes smoothly", Math.max(...v.map((x) => x[1])) < 1, `max ${Math.max(...v.map((x) => x[1])).toFixed(3)} px/ms`);
pass("scroll reaches the proof state", atEnd > 0.99, atEnd.toFixed(3));

// ---- reverse
const back = await p.evaluate(() => ({
  hudProof: document.querySelector(".home-hud")?.getAttribute("data-proof"),
  rebuildDisabled: document.querySelector(".home-pill--dark")?.disabled,
  index: document.querySelector(".home-hud__index")?.textContent,
}));
pass("reverse: Home's HUD returns at progress 0", !back.hudProof && back.rebuildDisabled === false && back.index === "00 / Home", JSON.stringify(back));

// ---- VHS and sound
pass("vhs: one pass going down, one coming back up", downVhs === 1 && upVhs === 1, `down ${downVhs}, up ${upVhs}`);
// four milestones + the VHS tape flick going down; only the tape flick coming back
pass("sound: four milestone cues (+ tape) going down", downBursts === 5, `${downBursts} bursts`);
pass("sound: nothing replayed going up but the tape flick", upBursts === 1, `${upBursts} bursts`);

// jiggle on the 0.2 threshold and inside the VHS window
await scrollTo(0.3); await p.waitForTimeout(900); await bursts(); await vhsRuns();
for (let i = 0; i < 6; i++) { await scrollTo(i % 2 ? 0.17 : 0.24); await p.waitForTimeout(300); }
pass("sound: jiggling across a threshold stays quiet", (await bursts()) === 0);
await scrollTo(0.52); await p.waitForTimeout(900); await vhsRuns();
for (let i = 0; i < 6; i++) { await scrollTo(i % 2 ? 0.48 : 0.56); await p.waitForTimeout(300); }
pass("vhs: jiggling inside the window never fires", (await vhsRuns()) === 0);

// ---- navigation from the proof
await scrollTo(1); await p.waitForTimeout(1200);
await p.locator("button:visible", { hasText: "[Home]" }).first().click();
await p.waitForTimeout(1600);
pass("[Home] from the proof returns to Home", (await progress()) < 0.01);
await scrollTo(1); await p.waitForTimeout(1200);
await p.keyboard.press("Escape");
await p.waitForTimeout(1600);
pass("Escape from the proof returns to Home", (await progress()) < 0.01);
await p.locator("body").focus();
await p.keyboard.press("PageDown");
await p.waitForTimeout(900);
pass("PageDown scrolls toward the proof", (await progress()) > 0.2, (await progress()).toFixed(2));
await scrollTo(1); await p.waitForTimeout(1200);
await p.locator("button:visible", { hasText: "[Work]" }).first().click();
await p.waitForFunction(() => document.querySelector(".experience").dataset.state === "work", null, { timeout: 8000 });
pass("[Work] from the proof: Home glides back, then Work", (await progress()) < 0.01);
await p.locator("button:visible", { hasText: "[Home]" }).first().click();
await p.waitForFunction(() => document.querySelector(".experience").dataset.state === "home", null, { timeout: 8000 });
await p.waitForTimeout(800);
await scrollTo(0.5); await p.waitForTimeout(900);
pass("proof works again after a round trip through Work", (await progress()) > 0.45);
pass("no page errors", errs.length === 0, errs.join(" | "));

await b.close();
console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
