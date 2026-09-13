import { chromium } from "playwright";
const OUT="/private/tmp/claude-501/-Users-joris-dev-portfolio/678195c8-3b68-4c2c-8c62-be0fb64c74c6/scratchpad";
const b=await chromium.launch();
const p=await b.newPage({ viewport:{width:1920,height:950}, deviceScaleFactor:1 });
const errs=[]; p.on("pageerror",e=>errs.push(e.message));
p.on("console",m=>{ if(m.type()==="error") errs.push(m.text()); });

// force the full intro every time for capture
await p.addInitScript(()=>{ try{ sessionStorage.removeItem("jvr.booted"); }catch{} });
await p.goto("http://localhost:4311/",{waitUntil:"domcontentloaded"});

const marks=[0.6,1.8,3.5,6.5,8.8,10.2,11.4];
let last=0;
for (const t of marks) {
  await p.waitForTimeout(Math.max(0,(t-last)*1000));
  last=t;
  await p.screenshot({ path:`${OUT}/boot-impl-${String(t).replace(".","_")}.png` });
}
const media=await p.evaluate(()=>({v:document.querySelectorAll("video").length,c:document.querySelectorAll("canvas").length}));
console.log("videos:",media.v,"canvases:",media.c);
console.log(errs.length?"ERRORS:\n"+errs.slice(0,4).join("\n"):"no console errors");
await b.close();
