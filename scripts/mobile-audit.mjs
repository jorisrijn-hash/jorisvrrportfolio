import { chromium, devices } from "playwright";
// Mobile / small-tablet audit: every main state at each viewport, plus
// overflow and off-screen checks. Screenshots go to argv[2].
const OUT = process.argv[2];
const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "430", width: 430, height: 932 },
  { name: "768", width: 768, height: 1024 },
  { name: "320", width: 320, height: 568 },
];
const base = "http://localhost:4311/";
const b = await chromium.launch();

async function audit(p, label) {
  const r = await p.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;
    const doc = document.documentElement;
    const offscreen = [];
    const overlaps = [];
    // Rects clipped by any scrolling ancestor: a paragraph inside a scroll
    // column is not "overlapping" the dock just because its box extends there.
    const clipped = (el) => {
      let r = el.getBoundingClientRect();
      let n = el.parentElement;
      while (n && n !== document.body) {
        const cs = getComputedStyle(n);
        if (/(auto|scroll|hidden|clip)/.test(cs.overflowY + cs.overflowX)) {
          const c = n.getBoundingClientRect();
          const top = Math.max(r.top, c.top), bottom = Math.min(r.bottom, c.bottom);
          const left = Math.max(r.left, c.left), right = Math.min(r.right, c.right);
          r = { top, bottom, left, right, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
        }
        n = n.parentElement;
      }
      return r;
    };
    const texts = [...document.querySelectorAll("button, a, p, h1, h2, dt, dd, span, li")]
      .filter((el) => !el.classList.contains("skip-link"))
      .filter((el) => {
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") return false;
        let o = 1, n = el;
        while (n && n !== document.body) { o *= +getComputedStyle(n).opacity; n = n.parentElement; }
        return o > 0.3 && el.getBoundingClientRect().width > 0 && el.childElementCount === 0 && el.textContent.trim();
      });
    for (const el of texts) {
      const rc = clipped(el);
      if (rc.width < 1 || rc.height < 1) continue;
      if (rc.right > vw + 1 || rc.left < -1 || rc.bottom > vh + 1 || rc.top < -1) offscreen.push(`${el.className || el.tagName}:"${el.textContent.trim().slice(0, 24)}"`);
    }
    const buttons = [...document.querySelectorAll("button, a[href]")].filter((el) => {
      if (el.classList.contains("skip-link")) return false;
      const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
      return cs.visibility !== "hidden" && cs.display !== "none" && rc.width > 0 && +cs.opacity > 0;
    });
    const small = buttons.filter((el) => { const rc = el.getBoundingClientRect(); return rc.width < 40 || rc.height < 40; })
      .map((el) => `${(el.getAttribute("aria-label") || el.textContent).trim().slice(0, 18)} ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = clipped(texts[i]), c = clipped(texts[j]);
      if (a.width < 1 || c.width < 1) continue;
      if (texts[i].contains(texts[j]) || texts[j].contains(texts[i])) continue;
      const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left);
      const iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      if (ix > 4 && iy > 4) overlaps.push(`"${texts[i].textContent.trim().slice(0, 16)}" x "${texts[j].textContent.trim().slice(0, 16)}"`);
    }
    return {
      scrollX: doc.scrollWidth > vw || document.body.scrollWidth > vw,
      scrollY: doc.scrollHeight > vh + 1,
      cursor: !!document.querySelector(".cursor"),
      offscreen: [...new Set(offscreen)].slice(0, 8),
      overlaps: [...new Set(overlaps)].slice(0, 8),
      smallTargets: small.slice(0, 8),
    };
  });
  console.log(`[${label}] hScroll=${r.scrollX} vScroll=${r.scrollY} cursor=${r.cursor}`);
  if (r.offscreen.length) console.log("   offscreen:", r.offscreen.join(" | "));
  if (r.overlaps.length) console.log("   overlaps:", r.overlaps.join(" | "));
  if (r.smallTargets.length) console.log("   small targets:", r.smallTargets.join(" | "));
}

for (const v of VIEWPORTS) {
  const ctx = await b.newContext({
    viewport: { width: v.width, height: v.height },
    isMobile: v.width < 700, hasTouch: true, deviceScaleFactor: 1,
    userAgent: devices["iPhone 13"].userAgent,
  });
  // first visit: gate -> loading -> transition -> home
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.removeItem("jvr.booted"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/${v.name}-gate.png` }); await audit(p, `${v.name} gate`);
  await p.getByRole("button", { name: /^off$/i }).tap();
  for (const [t, n] of [[1800, "load-trace"], [5200, "load-auth"], [9000, "load-complete"], [11700, "xfer"], [14600, "home"]]) {
    const st = Date.now(); await p.waitForTimeout(Math.max(0, t - (t === 1800 ? 0 : 0)) - 0);
    await p.screenshot({ path: `${OUT}/${v.name}-${n}.png` }); await audit(p, `${v.name} ${n}`);
    void st;
  }
  await ctx.close();

  // returning: home -> work -> about -> home
  const ctx2 = await b.newContext({
    viewport: { width: v.width, height: v.height },
    isMobile: v.width < 700, hasTouch: true, deviceScaleFactor: 1,
    userAgent: devices["iPhone 13"].userAgent,
  });
  const q = await ctx2.newPage();
  await q.addInitScript(() => { try { sessionStorage.setItem("jvr.booted", "1"); localStorage.setItem("jvr.sound", "off"); } catch {} });
  await q.goto(base, { waitUntil: "networkidle" });
  await q.waitForTimeout(1500);
  await q.screenshot({ path: `${OUT}/${v.name}-home2.png` }); await audit(q, `${v.name} home(return)`);
  const tapNav = async (name) => { const el = q.getByRole("button", { name }); if (await el.count()) await el.first().tap({ force: true }); else console.log("   NO BUTTON", name); };
  await tapNav("[Work]"); await q.waitForTimeout(1400);
  await q.screenshot({ path: `${OUT}/${v.name}-to-work.png` }); await audit(q, `${v.name} home-to-work`);
  await q.waitForTimeout(2200);
  await q.screenshot({ path: `${OUT}/${v.name}-work.png` }); await audit(q, `${v.name} work`);
  await tapNav("[About]"); await q.waitForTimeout(900);
  await q.screenshot({ path: `${OUT}/${v.name}-to-about.png` }); await audit(q, `${v.name} work-to-about`);
  await q.waitForTimeout(2000);
  await q.screenshot({ path: `${OUT}/${v.name}-about.png` }); await audit(q, `${v.name} about`);
  await tapNav("[Home]"); await q.waitForTimeout(2200);
  await q.screenshot({ path: `${OUT}/${v.name}-home3.png` }); await audit(q, `${v.name} back home`);
  await ctx2.close();
}
await b.close();
