import { ImageResponse } from "next/og";
import { GRID, cellsAtResolution } from "@/lib/logo";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon generated from the same cell geometry as the logo (lib/logo).
 * Resampled to 5x5 and drawn with no gap, so it reads as one solid
 * silhouette at 32px rather than dissolving into stripes.
 */
export default function Icon() {
  const n = 5;
  const cells = cellsAtResolution(n);
  const unit = size.width / n;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0B0B0A",
        }}
      >
        {cells.map(([x, y]) => (
          <div
            key={`${x}-${y}`}
            style={{
              position: "absolute",
              left: x * unit,
              top: y * unit,
              width: unit,
              height: unit,
              background: "#F1EDE4",
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
