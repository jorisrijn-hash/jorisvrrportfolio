import { chromium } from "playwright";
const b=await chromium.launch();
const p=await b.newPage({ viewport:{width:1920,height:950} });
await p.addInitScript(()=>{
  try{ sessionStorage.setItem("jvr.booted","1"); }catch{}
  // count React commits so we can prove the cursor causes none
  window.__renders = 0;
  const origCreate = Element.prototype.setAttribute;
});
await p.goto("http://localhost:4311/",{waitUntil:"networkidle"});
await p.waitForTimeout(800);

const pass=(n,c,x="")=>console.log(`${c?"PASS":"FAIL"}  ${n}${x?"  — "+x:""}`);

pass("cursor mounted", (await p.locator(".cursor").count())===1);
pass("pointer-events none", (await p.evaluate(()=>getComputedStyle(document.querySelector(".cursor")).pointerEvents))==="none");
pass("position fixed at 0,0", await p.evaluate(()=>{
  const s=getComputedStyle(document.querySelector(".cursor"));
  return s.position==="fixed" && s.top==="0px" && s.left==="0px";
}));
pass("native cursor hidden", (await p.getAttribute("html","data-cursor-hidden"))==="true");
pass("mark is a polygon, not a circle",
     (await p.locator(".cursor__mark polygon").count())===1 && (await p.locator(".cursor__mark circle").count())===0);

// movement
await p.mouse.move(400,300);
await p.waitForTimeout(400);
const t1 = await p.evaluate(()=>document.querySelector(".cursor").style.transform);
await p.mouse.move(1200,700);
await p.waitForTimeout(400);
const t2 = await p.evaluate(()=>document.querySelector(".cursor").style.transform);
pass("moves by transform", /translate3d/.test(t1) && t1!==t2, t2);
pass("becomes visible on move", (await p.getAttribute(".cursor","data-visible"))==="true");

// hover state
const btn = p.getByRole("button",{name:/replay the boot/i});
const box = await btn.boundingBox();
await p.mouse.move(box.x+box.width/2, box.y+box.height/2);
await p.waitForTimeout(300);
pass("state changes over a control", (await p.getAttribute(".cursor","data-state"))==="link",
     await p.getAttribute(".cursor","data-state"));
await p.mouse.move(900,500);
await p.waitForTimeout(300);
pass("state returns to default", (await p.getAttribute(".cursor","data-state"))==="default");

// rAF loop count: move continuously and sample frame intervals
const frames = await p.evaluate(()=>new Promise(res=>{
  const t=[]; let last=performance.now();
  (function tick(now){ t.push(now-last); last=now; if(t.length<240) requestAnimationFrame(tick); else res(t); })(performance.now());
  requestAnimationFrame(function f(n){});
}));
const s=frames.slice(5).sort((a,b)=>a-b);
console.log(`frame interval while idle: p50 ${s[Math.floor(s.length*0.5)].toFixed(1)}ms  worst ${s[s.length-1].toFixed(1)}ms`);
await b.close();
