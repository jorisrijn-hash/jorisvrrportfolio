import { chromium } from "playwright";
const b=await chromium.launch();
const p=await b.newPage({ viewport:{width:1920,height:950} });
await p.addInitScript(()=>{
  try{ sessionStorage.removeItem("jvr.booted"); localStorage.removeItem("jvr.sound"); }catch{}
  window.__audio=[];
  const O=window.Audio;
  window.Audio=class extends O { constructor(...a){ super(...a); window.__audio.push(this); } };
});
const snap=()=>p.evaluate(()=>window.__audio.map(a=>({t:+a.currentTime.toFixed(2),paused:a.paused,vol:+a.volume.toFixed(2)})));

await p.goto("http://localhost:4311/",{waitUntil:"networkidle"});
await p.waitForTimeout(700);
console.log("1) fresh visit, no consent      → audio objects:", (await snap()).length, "(must be 0)");

await p.getByRole("button",{name:/turn sound on/i}).click();
await p.waitForTimeout(1400);
console.log("2) sound ON mid-boot            →", JSON.stringify(await snap()), "(joins at offset)");

// let the boot finish, then replay with sound already on
await p.waitForTimeout(11000);
console.log("3) boot finished, state         =", await p.getAttribute(".experience","data-state"));
const rebuild = p.getByRole("button",{name:/replay the boot/i});
console.log("   [REBUILD] enabled            =", await rebuild.isEnabled());
await rebuild.click();
await p.waitForTimeout(1500);
console.log("4) after REBUILD, boot running  =", await p.locator(".boot").count());
const s=await snap();
console.log("   track playing from start     =", JSON.stringify(s[s.length-1]), "(t should be small, paused false)");
await b.close();
