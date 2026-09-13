import { chromium } from "playwright";
const base = "http://localhost:4311";
const b = await chromium.launch();
const pass = (n,c,x="") => console.log(`${c?"PASS":"FAIL"}  ${n}${x?"  — "+x:""}`);

// 1. REDUCED MOTION
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, reducedMotion:"reduce" });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(1200);
  const choice = await p.getByRole("button",{name:/enter silently/i}).isVisible().catch(()=>false);
  pass("reduced-motion: sound choice still offered", choice);
  if (choice) await p.getByRole("button",{name:/enter silently/i}).click();
  await p.waitForTimeout(1200);
  const hidden = await p.evaluate(()=>{
    let stuck=0;
    document.querySelectorAll(".u-clip > *").forEach(el=>{ if((getComputedStyle(el).clipPath||"").includes("100%")) stuck++; });
    return stuck;
  });
  pass("reduced-motion: no content stuck hidden", hidden===0, `${hidden} stuck`);
  const cursor = await p.locator(".jvr-cursor").count();
  pass("reduced-motion: custom cursor not mounted", cursor===0);
  await ctx.close();
}

// 2. RETURNING VISITOR (same session)
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(2200);
  await p.getByRole("button",{name:/enter silently/i}).click();
  await p.waitForTimeout(1400);
  await p.goto(base+"/work", { waitUntil:"networkidle" });
  await p.waitForTimeout(700);
  const introOnSecond = await p.locator(".jvr-intro").count();
  pass("returning visit: intro skipped entirely", introOnSecond===0);
  const sound = await p.evaluate(()=>localStorage.getItem("jvr.sound"));
  pass("sound choice persisted", sound==="off", `stored=${sound}`);
  await ctx.close();
}

// 3. KEYBOARD + FOCUS TRAP
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(2200);
  await p.getByRole("button",{name:/enter silently/i}).click();
  await p.waitForTimeout(1400);
  await p.keyboard.press("Tab");
  const first = await p.evaluate(()=>document.activeElement?.className||document.activeElement?.tagName);
  pass("first Tab reaches skip link", String(first).includes("skip-link"), String(first));

  await p.getByRole("button",{name:/^menu/i}).click();
  await p.waitForTimeout(1300);
  const inMenu = await p.evaluate(()=>!!document.activeElement?.closest(".jvr-menu"));
  pass("menu open: focus moved inside", inMenu);
  for (let i=0;i<12;i++) await p.keyboard.press("Tab");
  const trapped = await p.evaluate(()=>!!document.activeElement?.closest(".jvr-menu"));
  pass("menu: focus trapped after 12 tabs", trapped);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(1300);
  const closed = await p.locator(".jvr-menu").count();
  pass("Escape closes menu", closed===0);
  const restored = await p.evaluate(()=>document.activeElement?.textContent?.trim().slice(0,10));
  pass("focus returned to trigger", /Menu|Close/i.test(String(restored)), String(restored));
  await ctx.close();
}

// 4. NO SOUND BEFORE CONSENT
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const p = await ctx.newPage();
  let audioCreated = false;
  await p.addInitScript(()=>{ window.__ac=0; const O=window.AudioContext; window.AudioContext=class extends O{constructor(...a){super(...a);window.__ac++;}}; });
  await p.goto(base, { waitUntil:"networkidle" });
  await p.waitForTimeout(2400);
  audioCreated = await p.evaluate(()=>window.__ac>0);
  pass("no AudioContext before consent", !audioCreated);
  await ctx.close();
}
await b.close();
