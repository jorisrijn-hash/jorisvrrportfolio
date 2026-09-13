import { chromium } from "playwright";
const OUT="/private/tmp/claude-501/-Users-joris-dev-portfolio/678195c8-3b68-4c2c-8c62-be0fb64c74c6/scratchpad";
const b=await chromium.launch();
const errs=[];
const ctx=await b.newContext({viewport:{width:1512,height:945},deviceScaleFactor:2});
const p=await ctx.newPage();
p.on("pageerror",e=>errs.push(e.message));
p.on("console",m=>{if(m.type()==="error")errs.push(m.text())});
await p.goto("http://localhost:4311/",{waitUntil:"domcontentloaded"});
await p.waitForTimeout(600); await p.screenshot({path:`${OUT}/r1-intro-pixels.png`});
await p.waitForTimeout(1400); await p.screenshot({path:`${OUT}/r2-intro-sound.png`});
const s=p.getByRole("button",{name:/^without$/i}); if(await s.count())await s.click();
await p.waitForTimeout(1800); await p.screenshot({path:`${OUT}/r3-hero.png`});
// walk the scenes
const scenes=await p.$$("[data-scene]");
for(let i=1;i<scenes.length;i++){
  await scenes[i].scrollIntoViewIfNeeded();
  await p.waitForTimeout(1500);
  await p.screenshot({path:`${OUT}/r${3+i}-scene${i}.png`});
}
console.log("scenes:",scenes.length);
console.log(errs.length?"ERRORS:\n"+errs.slice(0,6).join("\n"):"no errors");
await b.close();
