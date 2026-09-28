/**
 * THE CENTRE CONSTRUCTION — loadingempty.png, measured.
 *
 * Fitted by masking out the 24px grid and fitting the remaining ink against a
 * candidate centre, which resolved to the viewport centre:
 *
 *   circle       r = 119, full 360deg      (strongest radius, 34/36 angular bins)
 *   dashed arc   r = 153
 *   outer ring   r = 179 (very faint — ~8x weaker per pixel than the circle)
 *   diamond      square rotated 45deg, vertices ON the circle (r = 119), so its
 *                edges pass at r = 119/sqrt2 = 84.1 — measured 85
 *   ticks        12 / 3 / 6 / 9 o'clock, just outside the circle
 *   triangle     apex up, with a solid marker at the apex
 *
 * Drawn 1:1 in reference units: every radius below is literally the number
 * measured from the file. Each element is its own <g> with its own transform
 * origin, ready to be animated separately later.
 */
const R_RING = 119;
const R_DASH = 153;
const R_OUTER = 179;
const BOX = 420; // half-extent of the viewBox

export function CenterDiagram({ label = "SESSION-READY" }: { label?: string }) {
  const c = BOX;
  const diamond = `${c},${c - R_RING} ${c + R_RING},${c} ${c},${c + R_RING} ${c - R_RING},${c}`;

  const apexY = c - 62;
  const baseY = c + 46;
  const half = 86;
  const triangle = `${c},${apexY} ${c + half},${baseY} ${c - half},${baseY}`;
  const apexMark = `${c},${apexY - 3} ${c + 20},${c + 3} ${c - 20},${c + 3}`;

  const ticks = [
    [c, c - 150, c, c - 128],
    [c, c + 128, c, c + 150],
    [c - 150, c, c - 128, c],
    [c + 128, c, c + 150, c],
  ];

  return (
    <svg
      className="centre"
      viewBox={`0 0 ${BOX * 2} ${BOX * 2}`}
      fill="none"
      aria-hidden="true"
    >
      <g className="centre__outer">
        <circle cx={c} cy={c} r={R_OUTER} stroke="var(--color-env-line)" strokeWidth="1" opacity="0.28" />
      </g>

      <g className="centre__dash">
        <circle
          cx={c}
          cy={c}
          r={R_DASH}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="5 9"
        />
      </g>

      <g className="centre__ring">
        <circle cx={c} cy={c} r={R_RING} stroke="currentColor" strokeWidth="1.15" />
      </g>

      <g className="centre__diamond">
        <polygon points={diamond} stroke="currentColor" strokeWidth="1" />
      </g>

      <g className="centre__plane">
        <polygon points={triangle} stroke="currentColor" strokeWidth="1" />
        <polygon points={apexMark} fill="var(--color-env-centre-fill)" stroke="none" />
      </g>

      <g className="centre__stem">
        <line x1={c} y1={c - 30} x2={c} y2={c + 30} stroke="currentColor" strokeWidth="1" />
      </g>

      <g className="centre__ticks">
        {ticks.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.6" />
        ))}
      </g>

      <text
        className="centre__label"
        x={c}
        y={c - 200}
        textAnchor="middle"
        fill="currentColor"
      >
        {label}
      </text>
    </svg>
  );
}
