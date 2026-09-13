/**
 * BLOCK NOISE — the soft, blocky tonal patches in loadingempty.png.
 *
 * These are what make the reference read as a larger grid on top of the
 * uniform 24px one. They are a texture, not geometry: quantised value noise at
 * very low contrast.
 *
 * Built as an inline SVG filter tiled by CSS, so it costs one paint and no
 * script — feTurbulence generates the field, feComponentTransfer/discrete
 * quantises it into blocks rather than smooth cloud.
 */
export function BlockNoise() {
  return (
    <div className="noise-layer" aria-hidden="true">
      <svg width="100%" height="100%" preserveAspectRatio="none">
        <filter id="blocknoise" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves="3"
            seed="7"
            result="n"
          />
          {/* quantise to flat steps so the field reads as blocks, not cloud */}
          <feComponentTransfer in="n" result="q">
            <feFuncR type="discrete" tableValues="0 0.35 0.6 0.85 1" />
            <feFuncG type="discrete" tableValues="0 0.35 0.6 0.85 1" />
            <feFuncB type="discrete" tableValues="0 0.35 0.6 0.85 1" />
          </feComponentTransfer>
          <feColorMatrix in="q" type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#blocknoise)" />
      </svg>
    </div>
  );
}
