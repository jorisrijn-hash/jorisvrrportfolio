import fs from "fs";

/** Before/after from two perf-suite.mjs JSON files: node scripts/perf-compare.mjs before.json after.json */
const [A, B] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
const kb = (o) => Math.round(Object.values(o).reduce((a, b) => a + b, 0) / 1024);
for (const a of A) {
  const b = B.find((x) => x.name === a.name);
  if (!b) continue;
  console.log(`\n=== ${a.name}   first load ${kb(a.firstLoad)}KB -> ${kb(b.firstLoad)}KB  (script ${Math.round(a.firstLoad.script / 1024)} -> ${Math.round(b.firstLoad.script / 1024)})   LCP ${Math.round(a.vitals.lcp?.t)} -> ${Math.round(b.vitals.lcp?.t)}ms   CLS ${a.vitals.cls} -> ${b.vitals.cls}`);
  console.log("scene".padEnd(13), "dropped".padStart(9), "hitches".padStart(9), "p95 ms".padStart(12), "long tasks".padStart(15), "script ms".padStart(13), "style ms".padStart(13), " cursor lag p50");
  for (const [s, x] of Object.entries(a.scenes)) {
    const y = b.scenes[s];
    if (!y) continue;
    const f = (u, v) => `${u}→${v}`;
    console.log(
      s.padEnd(13), f(x.dropped, y.dropped).padStart(9), f(x.hitch, y.hitch).padStart(9), f(x.p95, y.p95).padStart(12),
      f(`${x.long}(${x.longMs})`, `${y.long}(${y.longMs})`).padStart(15), f(x.script, y.script).padStart(13), f(x.style, y.style).padStart(13),
      x.cursorLag === null ? "" : `  ${x.cursorLag}→${y.cursorLag}px`,
    );
  }
  console.log(`repeat nav heap ${a.repeat.heapKB.join("→")}KB vs ${b.repeat.heapKB.join("→")}KB | listeners ${a.repeat.listeners.join("→")} vs ${b.repeat.listeners.join("→")} | errors ${b.errors.length}`);
}
