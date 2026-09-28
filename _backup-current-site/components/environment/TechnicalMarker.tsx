import type { CSSProperties, ReactNode } from "react";

type Anchor = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
};

type Props = Anchor & {
  w: number;
  h: number;
  label: string;
  children: ReactNode;
};

/**
 * A corner technical marker: a hairline frame with a diagram inside and a mono
 * label centred beneath. All four corners of loadingempty.png are this same
 * component.
 *
 * Anchored in FIXED PIXELS to the nearest edges, not percentages. The
 * reference is a HUD: its markers sit a set distance from the viewport edge
 * and keep their size, rather than stretching with the window. Percentage
 * positioning distorted the composition on any viewport that was not exactly
 * 1920x950 — which is every real one.
 *
 * Measured offsets (from loadingempty.png, design area 1904 x 946):
 *   STATUS-LOG  left 67   top 74      155 x 106
 *   ALL-CLEAR   right 78  top 68      117 x 116
 *   CH-OPEN     left 85   bottom 109  125 x 75
 *   SYNC-OK     right 90  bottom 93   179 x 96
 */
export function TechnicalMarker({ left, right, top, bottom, w, h, label, children }: Props) {
  // The direction it withdraws in during the handover to home: toward its corner.
  const style = {
    width: w,
    height: h,
    "--mx": left !== undefined ? "-28px" : "28px",
    "--my": top !== undefined ? "-28px" : "28px",
  } as CSSProperties;
  if (left !== undefined) style.left = left;
  if (right !== undefined) style.right = right;
  if (top !== undefined) style.top = top;
  if (bottom !== undefined) style.bottom = bottom;

  return (
    <div className="marker" style={style} aria-hidden="true">
      <div className="marker__frame">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">{children}</svg>
      </div>
      <span className="marker__label">{label}</span>
    </div>
  );
}

/* ---- the four diagrams, drawn in each marker's own coordinate space ---- */

/** Five readout rules of varying length, plus a filled node. */
export function StatusLogDiagram() {
  const lines = [
    { y: 16, x2: 130 },
    { y: 33, x2: 112 },
    { y: 49, x2: 137 },
    { y: 65, x2: 120 },
    { y: 81, x2: 96 },
  ];
  return (
    <g stroke="currentColor" strokeWidth="1" fill="none">
      {lines.map((l) => (
        <line key={l.y} x1="14" y1={l.y} x2={l.x2} y2={l.y} />
      ))}
      <circle cx="124" cy="65" r="7" fill="currentColor" stroke="none" opacity="0.75" />
    </g>
  );
}

/** Inner dashed frame with a check stroke. */
export function AllClearDiagram() {
  return (
    <g fill="none" stroke="currentColor">
      <rect x="10" y="14" width="97" height="88" strokeWidth="1" strokeDasharray="6 5" opacity="0.8" />
      <path d="M32 50 L54 74 L88 28" strokeWidth="2.2" strokeLinecap="square" />
    </g>
  );
}

/** A small ringed node with a starburst through it. */
export function ChannelOpenDiagram() {
  const cx = 62.5;
  const cy = 37.5;
  const d = 21;
  return (
    <g stroke="currentColor" fill="none" strokeWidth="1">
      <circle cx={cx} cy={cy} r="13" />
      <circle cx={cx} cy={cy} r="3.2" fill="currentColor" stroke="none" />
      <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} />
      <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d} />
      <line x1={cx - 34} y1={cy} x2={cx + 34} y2={cy} opacity="0.55" />
    </g>
  );
}

/** A single smooth S-curve trace. */
export function SyncOkDiagram() {
  return (
    <path
      d="M18 62 C 44 30, 66 40, 84 52 C 104 66, 116 20, 140 22 C 156 23, 162 44, 166 58"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  );
}
