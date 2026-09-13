import { GRID, cellsAtResolution } from "@/lib/logo";

type Props = {
  /** Rendered size in px. */
  size?: number;
  /**
   * Space between cells, as a fraction of one cell (0–0.4).
   * 0    = solid silhouette (favicon, small sizes)
   * 0.12 = the default modular reading
   * 0.3+ = deconstructed, for hover and transitions
   */
  gap?: number;
  /** Lower values resample to a coarser grid — real pixelation, not a filter. */
  resolution?: number;
  /** Omit for decorative use; the parent then supplies the accessible name. */
  title?: string;
  className?: string;
};

/**
 * The brand mark. Pure SVG with no client JS — safe in the header, the
 * footer, and static rendering. The intro's animated variant lives in
 * AssemblingMark and reads the same geometry from lib/logo.
 */
export function LogoMark({
  size = 24,
  gap = 0.12,
  resolution = GRID,
  title,
  className,
}: Props) {
  const n = Math.max(1, Math.min(GRID, Math.round(resolution)));
  const cells = cellsAtResolution(n);
  const unit = GRID / n; // keep the viewBox stable across resolutions
  const inset = (gap * unit) / 2;
  const side = unit - gap * unit;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${GRID} ${GRID}`}
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      shapeRendering="crispEdges"
    >
      {title ? <title>{title}</title> : null}
      {cells.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x * unit + inset}
          y={y * unit + inset}
          width={side}
          height={side}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
