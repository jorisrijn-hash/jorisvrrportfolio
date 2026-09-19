/**
 * BLOCK NOISE — the soft, blocky tonal patches in loadingempty.png.
 *
 * These are what make the reference read as a larger grid on top of the
 * uniform 24px one. They are a texture, not geometry: quantised value noise at
 * very low contrast.
 *
 * A baked tile (public/blocknoise.png, from scripts/bake-blocknoise.mjs). It
 * was a live full-screen SVG feTurbulence multiplied into the page; the bake
 * is the same filter chain, converted so plain compositing gives the same
 * pixels with no filter and no blend mode (the blend made the whole stage an
 * isolated render surface every frame).
 */
export function BlockNoise() {
  return <div className="noise-layer" aria-hidden="true" />;
}
