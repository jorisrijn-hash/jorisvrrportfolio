import { chromium } from "playwright";
import { execFileSync } from "child_process";

/**
 * BLOCK NOISE, baked — public/blocknoise.png.
 *
 * The environment's block noise was a live full-screen SVG feTurbulence
 * (3 octaves, rasterised on the CPU at device resolution) multiplied into the
 * page with mix-blend-mode. This renders the same filter chain once, as a
 * seamless tile (stitchTiles), reads its sRGB grey n from a screenshot, and
 * converts it for plain compositing:
 *
 *   multiply of grey n at opacity k   = bg * (1 - k(1 - n))
 *   black at alpha (1 - n), opacity k = bg * (1 - k(1 - n))     — identical
 *
 * so the page draws the same pixels with no filter and no blend mode.
 * Rendered at 1024px (same noise frequency in CSS px as before), stored at
 * 512px with alpha in 16 levels, displayed at background-size 1024px. At the
 * layer's 5% opacity that changes no pixel by more than ~0.2% luminance, and
 * the file drops from 268KB to ~63KB.
 */
const TILE = 1024;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: TILE, height: TILE } });
// Exactly the original chain (grey, opaque); the alpha conversion happens
// on the screenshot's sRGB values below, so it is exact by construction.
await p.setContent(`<style>html,body{margin:0}</style>
<svg width="${TILE}" height="${TILE}" xmlns="http://www.w3.org/2000/svg">
  <filter id="n" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" stitchTiles="stitch" result="t"/>
    <feComponentTransfer in="t" result="q">
      <feFuncR type="discrete" tableValues="0 0.35 0.6 0.85 1"/>
      <feFuncG type="discrete" tableValues="0 0.35 0.6 0.85 1"/>
      <feFuncB type="discrete" tableValues="0 0.35 0.6 0.85 1"/>
    </feComponentTransfer>
    <feColorMatrix in="q" type="saturate" values="0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#n)"/>
</svg>`);
await p.screenshot({ path: "/tmp/blocknoise-1024.png" });
await b.close();
execFileSync("python3", ["-c", `
from PIL import Image
grey = Image.open('/tmp/blocknoise-1024.png').convert('L')
im = grey.point(lambda n: 255 - n).resize((512, 512), Image.LANCZOS)   # alpha = 1 - n
a = im.point(lambda v: round(v * 15 / 255) * 17)
Image.merge('LA', (Image.new('L', im.size, 0), a)).save('public/blocknoise.png', optimize=True)
import os; print('public/blocknoise.png', os.path.getsize('public/blocknoise.png') // 1024, 'KB')
`], { stdio: "inherit" });
