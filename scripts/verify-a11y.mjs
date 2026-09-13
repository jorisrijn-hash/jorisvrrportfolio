import { chromium } from "playwright";
const base = "http://localhost:4311";
const b = await chromium.launch();
const pass = (n, c, x = "") => console.log(`${c ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`);

const skipBoot = () => { try { sessionStorage.setItem("jvr.booted", "1"); } catch {} };

// 1. BOOT gating
{
  const ctx = await b.newContext({ viewport: { width: 1920, height: 950 } });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  pass("first visit: boot sequence plays", (await p.locator(".boot").count()) === 1);
  await p.locator(".boot__skip button").click();
  await p.waitForTimeout(900);
  pass("boot is skippable", (await p.locator(".boot").count()) === 0);
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  pass("returning in session: boot skipped", (await p.locator(".boot").count()) === 0);
  await ctx.close();
}

// 2. REDUCED MOTION
{
  const ctx = await b.newContext({ viewport: { width: 1920, height: 950 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  pass("reduced motion: no boot video", (await p.locator(".boot video").count()) === 0);
  pass("reduced motion: media falls back to stills", (await p.locator(".media-layer img").count()) > 0);
  pass("reduced motion: no custom cursor", (await p.locator(".cursor").count()) === 0);
  pass("reduced motion: HUD still present", (await p.locator(".hud-topbar").count()) === 1);
  await ctx.close();
}

// 3. KEYBOARD + STATE
{
  const ctx = await b.newContext({ viewport: { width: 1920, height: 950 } });
  const p = await ctx.newPage();
  await p.addInitScript(skipBoot);
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(1400);

  await p.keyboard.press("Tab");
  const first = await p.evaluate(() => document.activeElement?.className ?? "");
  pass("first Tab reaches skip link", String(first).includes("skip-link"), String(first));

  // every control reachable and labelled
  const unlabelled = await p.evaluate(() =>
    [...document.querySelectorAll("button")].filter(
      (el) => !el.textContent?.trim() && !el.getAttribute("aria-label"),
    ).length,
  );
  pass("every button has an accessible name", unlabelled === 0, `${unlabelled} unlabelled`);

  await p.getByRole("button", { name: /expt\. logs/i }).click();
  await p.waitForTimeout(400);
  const busyState = await p.getAttribute(".experience", "data-state");
  pass("navigation enters a transition state", busyState === "WORK_IN", String(busyState));

  // Navigation must be locked mid-transition. The sound toggle is deliberately
  // NOT locked — muting has to stay available at any moment.
  const navLocked = await p.evaluate(
    () => [...document.querySelectorAll(".hud-topbar__right button")].every((b) => b.disabled),
  );
  const soundFree = await p.evaluate(
    () => [...document.querySelectorAll(".hud-topbar__left button")].every((b) => !b.disabled),
  );
  pass("navigation locked while transitioning", navLocked);
  pass("sound toggle stays available mid-transition", soundFree);

  await p.waitForTimeout(5400);
  pass("settles into WORK", (await p.getAttribute(".experience", "data-state")) === "WORK");

  await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(300);
  pass("arrow keys change project", (await p.locator('.work__thumb[aria-current="true"]').count()) === 1);

  await p.keyboard.press("Escape");
  await p.waitForTimeout(2400);
  pass("Escape returns home", (await p.getAttribute(".experience", "data-state")) === "HOME");
  await ctx.close();
}

// 4. SOUND CONSENT
{
  const ctx = await b.newContext({ viewport: { width: 1920, height: 950 } });
  const p = await ctx.newPage();
  await p.addInitScript(skipBoot);
  await p.addInitScript(() => {
    window.__ac = 0;
    const O = window.AudioContext;
    window.AudioContext = class extends O { constructor(...a) { super(...a); window.__ac++; } };
  });
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(1800);
  pass("no AudioContext before consent", !(await p.evaluate(() => window.__ac > 0)));
  await ctx.close();
}
await b.close();
