"use client";

/**
 * THE CENTRE CONSTRUCTION — loadingempty.png, measured.
 *
 * Fitted from the reference by masking the 24px grid and fitting the
 * remaining ink:
 *   centre        viewport centre (fit gave 952.5, 468.5 on a 1905x947 area)
 *   circle        r = 119, full 360deg
 *   diamond       square rotated 45deg, vertices ON the circle (r = 119),
 *                 so its edges pass at r = 119/sqrt2 = 84.1 (measured 85)
 *   dashed arc    r = 153
 *   outer ring    r = 179
 *   ticks         at 12 / 3 / 6 / 9 o'clock, just outside the circle
 *   triangle      apex up, with a small solid triangle at the apex
 *
 * Drawn in a 1:1 user-unit SVG centred on the viewport so every radius above
 * is literally the number measured from the file.
 */
export function CentreConstruction({
  label = "SESSION-READY",
  opacity = 1,
  className,
}: {
  label?: string;
  opacity?: number;
  className?: string;
}) {
  const S = 420;               // viewBox half-extent
  const c = S;                 // centre in viewBox units
  const stroke = "#c8c8c8";

  // Diamond vertices on the main circle
  const R = 119;
  const diamond = `${c},${c - R} ${c + R},${c} ${c},${c + R} ${c - R},${c}`;

  // Inner triangle: apex up, base on the diamond's lower half
  const tApexY = c - 62;
  const tBaseY = c + 46;
  const tHalf = 86;
  const triangle = `${c},${tApexY} ${c + tHalf},${tBaseY} ${c - tHalf},${tBaseY}`;

  // Solid apex marker
  const solid = `${c},${tApexY - 4} ${c + 21},${c + 4} ${c - 21},${c + 4}`;

  const ticks = [
    { x1: c, y1: c - 150, x2: c, y2: c - 128 },
    { x1: c, y1: c + 128, x2: c, y2: c + 150 },
    { x1: c - 150, y1: c, x2: c - 128, y2: c },
    { x1: c + 128, y1: c, x2: c + 150, y2: c },
  ];

  return (
    <svg
      className={`env-construct ${className ?? ""}`}
      viewBox={`0 0 ${S * 2} ${S * 2}`}
      width={S * 2}
      height={S * 2}
      fill="none"
      aria-hidden="true"
      style={{ opacity }}
    >
      {/* outer ring + dashed arc */}
      <circle cx={c} cy={c} r={179} stroke={stroke} strokeWidth="1" opacity="0.45" />
      <circle
        cx={c}
        cy={c}
        r={153}
        stroke={stroke}
        strokeWidth="1"
        strokeDasharray="5 9"
        opacity="0.75"
      />

      {/* main circle */}
      <circle cx={c} cy={c} r={R} stroke="#b4b4b4" strokeWidth="1.15" />

      {/* inscribed diamond */}
      <polygon points={diamond} stroke={stroke} strokeWidth="1" />

      {/* triangle + solid apex */}
      <polygon points={triangle} stroke={stroke} strokeWidth="1" />
      <polygon points={solid} fill="#cfcfcf" />

      {/* centre stem */}
      <line x1={c} y1={c - 30} x2={c} y2={c + 30} stroke={stroke} strokeWidth="1" />

      {/* cardinal ticks */}
      {ticks.map((t, i) => (
        <line key={i} {...t} stroke="#b4b4b4" strokeWidth="1.5" />
      ))}

      <text
        x={c}
        y={c - 200}
        textAnchor="middle"
        fill="#a8a8a8"
        style={{
          font: "500 10px var(--font-mono)",
          letterSpacing: "0.34em",
        }}
      >
        {label}
      </text>
    </svg>
  );
}
