import { chromium } from "playwright";
const b=await chromium.launch();
const p=await b.newPage({ viewport:{width:1920,height:950} });
await p.addInitScript(()=>{ try{ sessionStorage.setItem("jvr.booted","1"); }catch{} });
await p.goto("http://localhost:4311/",{waitUntil:"networkidle"});
await p.waitForTimeout(700);

// start sampling frames, then hammer the pointer across the viewport
const sample = p.evaluate(()=>new Promise(res=>{
  const t=[]; let last=performance.now();
  (function tick(now){ t.push(now-last); last=now; if(t.length<420) requestAnimationFrame(tick); else res(t); })(performance.now());
}));
for (let i=0;i<160;i++) {
  await p.mouse.move(200 + (i*11)%1500, 150 + (i*17)%700);
}
const frames = await sample;
const s = frames.slice(10).sort((a,b)=>a-b);
const p50=s[Math.floor(s.length*0.5)], p95=s[Math.floor(s.length*0.95)], worst=s[s.length-1];
console.log(`under continuous pointer movement:`);
console.log(`  p50 ${p50.toFixed(1)}ms  p95 ${p95.toFixed(1)}ms  worst ${worst.toFixed(1)}ms`);
console.log(`  dropped (>20ms): ${s.filter(x=>x>20).length}/${s.length}`);

// how many rAF loops are alive? patch rAF and count distinct callers per frame
const loops = await p.evaluate(()=>new Promise(res=>{
  let count=0; const orig=requestAnimationFrame;
  window.requestAnimationFrame=(cb)=>{ count++; return orig(cb); };
  setTimeout(()=>{ window.requestAnimationFrame=orig; res(count); }, 1000);
}));
console.log(`  rAF callbacks scheduled in 1s of idle: ${loops} (one loop parked ≈ 0-2)`);
await b.close();
