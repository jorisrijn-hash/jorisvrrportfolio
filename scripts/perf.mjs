import { chromium } from "playwright";
const b=await chromium.launch();
const p=await b.newPage({ viewport:{width:1920,height:950} });
await p.addInitScript(()=>{ try{ sessionStorage.removeItem("jvr.booted"); }catch{} });
await p.goto("http://localhost:4311/",{waitUntil:"domcontentloaded"});

// sample frame intervals across the whole boot
const frames = await p.evaluate(() => new Promise((res)=>{
  const t=[]; let last=performance.now();
  function tick(now){ t.push(now-last); last=now; if (now < performance.timeOrigin+0) {} 
    if (t.length < 700) requestAnimationFrame(tick); else res(t); }
  requestAnimationFrame(tick);
}));
const s=frames.slice(10).sort((a,b)=>a-b);
const p50=s[Math.floor(s.length*0.5)], p95=s[Math.floor(s.length*0.95)], worst=s[s.length-1];
console.log(`frame interval: p50 ${p50.toFixed(1)}ms  p95 ${p95.toFixed(1)}ms  worst ${worst.toFixed(1)}ms`);
console.log(`dropped (>20ms): ${s.filter(x=>x>20).length}/${s.length}`);
const media=await p.evaluate(()=>({v:document.querySelectorAll("video").length,c:document.querySelectorAll("canvas").length}));
console.log("videos:",media.v,"canvases:",media.c);
await b.close();
