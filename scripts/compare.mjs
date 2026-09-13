import { chromium } from "playwright";
const OUT="/private/tmp/claude-501/-Users-joris-dev-portfolio/678195c8-3b68-4c2c-8c62-be0fb64c74c6/scratchpad";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1920,height:950}, deviceScaleFactor:1 });
const p = await ctx.newPage();
const errs=[]; p.on("pageerror",e=>errs.push(e.message));
p.on("console",m=>{ if(m.type()==="error") errs.push(m.text()); });

// skip boot for comparison shots
await p.addInitScript(()=>{ try{ sessionStorage.setItem("jvr.booted","1"); }catch{} });

await p.goto("http://localhost:4311/", { waitUntil:"networkidle" });
await p.waitForTimeout(2500);
await p.screenshot({ path:`${OUT}/impl-home.png` });

await p.goto("http://localhost:4311/work", { waitUntil:"networkidle" });
await p.waitForTimeout(6500);
await p.screenshot({ path:`${OUT}/impl-work.png` });

await p.goto("http://localhost:4311/about", { waitUntil:"networkidle" });
await p.waitForTimeout(4500);
await p.screenshot({ path:`${OUT}/impl-about.png` });

console.log(errs.length ? "ERRORS:\n"+errs.slice(0,5).join("\n") : "no console errors");
await b.close();
