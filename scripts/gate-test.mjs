import { chromium } from "playwright";
const OUT="/private/tmp/claude-501/-Users-joris-dev-portfolio/678195c8-3b68-4c2c-8c62-be0fb64c74c6/scratchpad";
const b=await chromium.launch();
const pass=(n,c,x="")=>console.log(`${c?"PASS":"FAIL"}  ${n}${x?"  — "+x:""}`);
const p=await b.newPage({ viewport:{width:1920,height:950}, deviceScaleFactor:1 });
await p.addInitScript(()=>{
  try{ sessionStorage.removeItem("jvr.booted"); localStorage.removeItem("jvr.sound"); }catch{}
  window.__audio=[]; const O=window.Audio;
  window.Audio=class extends O { constructor(...a){ super(...a); window.__audio.push(this); } };
});
await p.goto("http://localhost:4311/",{waitUntil:"networkidle"});
await p.waitForTimeout(700);

pass("gate shown first", (await p.locator(".gate").count())===1);
pass("state is gate", (await p.getAttribute(".experience","data-state"))==="gate");
pass("boot NOT running yet", (await p.locator(".boot").count())===0);
pass("no audio created yet", (await p.evaluate(()=>window.__audio.length))===0);
await p.screenshot({path:`${OUT}/gate.png`});

// choose ON — this is the gesture that unlocks audio
await p.getByRole("button",{name:/^on$/i}).click();
await p.waitForTimeout(1200);
pass("gate dismissed", (await p.locator(".gate").count())===0);
pass("boot running", (await p.locator(".boot").count())===1);
const a = await p.evaluate(()=>window.__audio.map(x=>({t:+x.currentTime.toFixed(2),paused:x.paused})));
pass("soundtrack playing from the start", a.length===1 && !a[0].paused && a[0].t < 3, JSON.stringify(a));

// cursor visible without pressing
await p.mouse.move(900,500);
await p.waitForTimeout(250);
pass("cursor visible on move (no press)", (await p.getAttribute(".cursor","data-visible"))==="true");
await b.close();
