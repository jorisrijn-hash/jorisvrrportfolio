import { BODY, SOLID, SPLIT_TRAVEL, TIP, VIEWBOX, toPoints } from "@/lib/logo";

type Props = {
  size?: number | string;
  /**
   * 0   solid arrowhead (favicon, 16px, cursor)
   * 0.6 tip detached — the resting identity
   * 1   planes fully separated
   */
  split?: number;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The mark. Pure SVG, no client JS — safe in the header, footer and static
 * rendering. Below split 0.02 it draws as ONE polygon so small sizes stay a
 * single solid silhouette instead of two specks.
 */
export function LogoMark({ size = 24, split = 0, title, className, style }: Props) {
  const d = split * SPLIT_TRAVEL;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill="none"
      className={className}
      style={style}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {split < 0.02 ? (
        <polygon points={toPoints(SOLID)} fill="currentColor" />
      ) : (
        <>
          {/* The cut opens along its own normal: tip advances, body falls back. */}
          <polygon
            points={toPoints(TIP)}
            fill="currentColor"
            transform={`translate(${-d} ${-d})`}
          />
          <polygon
            points={toPoints(BODY)}
            fill="currentColor"
            transform={`translate(${d} ${d})`}
          />
        </>
      )}
    </svg>
  );
}
