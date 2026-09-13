import { chromium } from "playwright";
const OUT="/private/tmp/claude-501/-Users-joris-dev-portfolio/678195c8-3b68-4c2c-8c62-be0fb64c74c6/scratchpad";
const b=await chromium.launch();
for (const [w,h,tag,mob] of [[1920,950,"desk",false],[1366,768,"laptop",false],[834,1112,"tablet",false],[390,844,"phone",true]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:mob,hasTouch:mob});
  const p=await ctx.newPage();
  await p.addInitScript(()=>{try{sessionStorage.setItem("jvr.booted","1")}catch{}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("http://localhost:4311/",{waitUntil:"networkidle"});
  await p.waitForTimeout(1800);
  const ov = await p.evaluate(()=>({ sw: document.documentElement.scrollWidth, vw: window.innerWidth,
    sh: document.documentElement.scrollHeight, vh: window.innerHeight }));
  await p.screenshot({path:`${OUT}/r-${tag}.png`});
  console.log(`${tag.padEnd(7)} ${w}x${h}  scrollW=${ov.sw} vw=${ov.vw}  scrollH=${ov.sh} vh=${ov.vh}  ${errs[0]??"ok"}`);
  await ctx.close();
}
await b.close();
