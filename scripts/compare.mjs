import { chromium } from "playwright";
const OUT="/private/tmp/claude-501/-Users-joris-dev-portfolio/678195c8-3b68-4c2c-8c62-be0fb64c74c6/scratchpad";
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1920,height:950}, deviceScaleFactor:1 });
const errs=[]; p.on("pageerror",e=>errs.push(e.message));
p.on("console",m=>{ if(m.type()==="error") errs.push(m.text()); });
await p.goto("http://localhost:4311/", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
await p.screenshot({ path:`${OUT}/impl-static.png` });
// hard guarantee: nothing may render a reference video
const media = await p.evaluate(()=>({
  videos: document.querySelectorAll("video").length,
  canvases: document.querySelectorAll("canvas").length,
  mp4: [...document.querySelectorAll("*")].filter(e=>(e.outerHTML||"").includes(".mp4")).length,
}));
console.log("videos:",media.videos," canvases:",media.canvases," mp4 refs:",media.mp4);
console.log(errs.length ? "ERRORS:\n"+errs.slice(0,4).join("\n") : "no console errors");
await b.close();
