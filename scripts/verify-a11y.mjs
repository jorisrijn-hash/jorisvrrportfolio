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
  pass("crash resets to the sound selection", (await p.getAttribute(".experience", "data-state")) === "gate"
       && (await p.locator(".gate").count()) === 1);
  pass("nothing of home survives the reset",
       (await p.locator(".sculpture").count()) === 0 && (await p.locator(".bloom-layer").count()) === 0
       && (await p.locator(".crash").count()) === 0
       && (await p.getAttribute(".experience", "data-x-bloom")) === null);
  await p.getByRole("button", { name: /^on$/i }).click();
  await p.waitForTimeout(600);
  pass("sequence runs again after the reset", (await p.locator(".boot").count()) === 1
       && (await p.locator(".sculpture").count()) === 0);
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

// 3b. ABOUT — home -> about -> home
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950} })).newPage();
  await p.addInitScript(seen);
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(900);
  pass("telemetry block shown in home", (await p.locator(".home-hud__telemetry").count()) === 1
       && /^\d{10}$/.test((await p.textContent(".home-hud__t-unix")) ?? ""));
  await p.getByRole("button", { name: "[About]" }).click();
  await p.waitForTimeout(300);
  pass("about: transition state", (await p.getAttribute(".experience","data-state")) === "to-about");
  pass("about: nav refused mid-transition", await p.getByRole("button", { name: "[Home]" }).isDisabled());
  await p.waitForTimeout(2600);
  pass("about: arrives", (await p.getAttribute(".experience","data-state")) === "about");
  pass("about: panels resolved", (await p.getAttribute(".about","data-panels")) !== null
       && (await p.getByRole("heading", { level: 1 }).count()) === 1);
  pass("about: globe drawn from land data", ((await p.getAttribute(".about__globe path", "d")) ?? "").length > 1000);
  pass("about: sculpture parked", await p.evaluate(() => document.querySelector(".sculpture").style.visibility === "hidden"));
  pass("about: rebuild hidden", await p.getByRole("button", { name: /rebuild/i }).isDisabled());
  const links = await p.evaluate(() => [...document.querySelectorAll(".about__meta a")].map((a) => [a.textContent, a.getAttribute("href"), a.getAttribute("target")]));
  pass("about: email is a mailto link", links.some(([t, h]) => t === "jorisvrr@gmail.com" && h === "mailto:jorisvrr@gmail.com"));
  pass("about: phone is a tel link", links.some(([t, h]) => t === "0638032065" && h?.startsWith("tel:")));
  pass("about: website opens jorisvrr.com", links.some(([t, h, tg]) => t === "jorisvrr.com" && h === "https://jorisvrr.com" && tg === "_blank"));
  pass("about: meta rows are the contact rows", (await p.$$eval(".about__meta dt", (d) => d.map((x) => x.textContent).join("|"))) === "Name|Email|Phone|Location|Website");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  pass("about: Escape returns", (await p.getAttribute(".experience","data-state")) === "to-home");
  await p.waitForTimeout(2000);
  pass("about: back in home", (await p.getAttribute(".experience","data-state")) === "home"
       && (await p.locator(".about").count()) === 0
       && (await p.locator(".sculpture").count()) === 1
       && (await p.getAttribute(".experience","data-x-about")) === null);
  await p.context().close();
}

// 3c. FEATURED WORK — home -> work -> home
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950} })).newPage();
  await p.addInitScript(seen);
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(900);
  await p.getByRole("button", { name: "[Work]" }).click();
  await p.waitForTimeout(300);
  pass("work: transition state", (await p.getAttribute(".experience","data-state")) === "home-to-work");
  pass("work: about refused mid-transition", await p.getByRole("button", { name: "[About]" }).isDisabled());
  pass("work: surface assembling from 216 cells", (await p.locator(".work-cell").count()) === 216
       && (await p.getAttribute(".work","data-form")) !== null);
  pass("work: not yet settled", (await p.getAttribute(".work","data-solid")) === null);
  await p.waitForTimeout(3100);
  pass("work: arrives only once resolved", (await p.getAttribute(".experience","data-state")) === "work"
       && (await p.getAttribute(".work","data-solid")) !== null && (await p.getAttribute(".work","data-ui")) !== null);
  pass("work: media inside the surface", await p.locator(".work-media img").isVisible());
  pass("work: project heading", (await p.getByRole("heading", { level: 1 }).count()) === 1);
  const box = await p.locator(".work-media").boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
  await p.waitForTimeout(300);
  pass("work: cursor turns to VIEW over media", (await p.getAttribute(".cursor","data-state")) === "view");
  pass("work: about reachable from work", !(await p.getByRole("button", { name: "[About]" }).isDisabled()));
  await p.getByRole("button", { name: "[Home]" }).click();
  await p.waitForTimeout(300);
  pass("work: return transition", (await p.getAttribute(".experience","data-state")) === "work-to-home");
  await p.waitForTimeout(1700);
  pass("work: back in home", (await p.getAttribute(".experience","data-state")) === "home"
       && (await p.locator(".work").count()) === 0
       && (await p.locator(".sculpture").count()) === 1
       && (await p.getAttribute(".experience","data-x-work")) === null);
  await p.context().close();
}

// 3d. CONNECTED — work -> home continuity, and work <-> about
{
  const p = await (await b.newContext({ viewport:{width:1920,height:950} })).newPage();
  await p.addInitScript(seen);
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(900);
  const state = () => p.getAttribute(".experience","data-state");
  const visibleCells = () => p.evaluate(() => {
    const host = document.querySelector(".work-cells");
    if (!host || getComputedStyle(host).display === "none") return 0;
    return [...document.querySelectorAll(".work-cell")].filter((c) => +getComputedStyle(c).opacity > 0.5).length;
  });

  await p.getByRole("button", { name: "[Work]" }).click();
  await p.waitForTimeout(3300);
  await p.getByRole("button", { name: "[Home]" }).click();
  await p.waitForTimeout(90);
  pass("work->home: the surface is still there right after the press", (await visibleCells()) > 150);
  await p.waitForTimeout(1500);
  pass("work->home: arrives home", (await state()) === "home");

  await p.getByRole("button", { name: "[Work]" }).click();
  await p.waitForTimeout(3300);
  await p.getByRole("button", { name: "[About]" }).click();
  await p.waitForTimeout(700);
  pass("work->about: one transition state", (await state()) === "work-to-about");
  pass("work->about: both stages mounted mid-handover",
       (await p.locator(".work").count()) === 1 && (await p.locator(".about").count()) === 1);
  pass("work->about: cells re-gridding, not vanished", (await visibleCells()) > 150);
  pass("work->about: nav refused mid-transition", await p.getByRole("button", { name: "[Home]" }).isDisabled());
  await p.waitForTimeout(2000);
  pass("work->about: arrives in about", (await state()) === "about"
       && (await p.locator(".work").count()) === 0 && (await p.getAttribute(".about","data-panels")) !== null);

  await p.getByRole("button", { name: "[Work]" }).click();
  await p.waitForTimeout(120);
  pass("about->work: panels hand over to cells", (await state()) === "about-to-work" && (await visibleCells()) > 150);
  await p.waitForTimeout(1000);
  pass("about->work: not settled early", (await state()) === "about-to-work");
  await p.waitForTimeout(1200);
  pass("about->work: arrives in work, resolved", (await state()) === "work"
       && (await p.getAttribute(".work","data-solid")) !== null
       && (await p.locator(".about").count()) === 0);
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
