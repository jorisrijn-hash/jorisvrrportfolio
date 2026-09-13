import { chromium } from "playwright";
const OUT="/private/tmp/claude-501/-Users-joris-dev-portfolio/678195c8-3b68-4c2c-8c62-be0fb64c74c6/scratchpad";
const b=await chromium.launch();
const p=await b.newPage({ viewport:{width:2056,height:1174}, deviceScaleFactor:1 });
await p.goto("http://localhost:4311/",{waitUntil:"networkidle"});
await p.waitForTimeout(600);
await p.screenshot({ path:`${OUT}/impl-yoursize.png` });
console.log("captured 2056x1174");
await b.close();
