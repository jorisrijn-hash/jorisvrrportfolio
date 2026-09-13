import { chromium } from "playwright";
const b = await chromium.launch();
for (const [w,h,tag] of [[1920,950,"reference"],[2056,1174,"yours"],[1440,800,"laptop"]]) {
  const p = await b.newPage({ viewport:{width:w,height:h} });
  await p.goto("http://localhost:4311/", { waitUntil:"networkidle" });
  await p.waitForTimeout(500);
  const m = await p.evaluate(()=>{
    const g=(s)=>{const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};};
    const c=g(".centre"); const tl=g(".marker"); const lbl=g(".state-label");
    return {centre:c, tl, lbl, vw:innerWidth, vh:innerHeight};
  });
  // ratio of centre diagram size to viewport width — should be constant
  const ratio = (m.centre.w / m.vw * 100).toFixed(1);
  const tlx = (m.tl.x / m.vw * 100).toFixed(1);
  const tly = (m.tl.y / m.vh * 100).toFixed(1);
  console.log(`${tag.padEnd(10)} ${w}x${h}  centre ${m.centre.w}px = ${ratio}% of width   TL marker at ${tlx}%,${tly}%`);
  await p.close();
}
await b.close();
