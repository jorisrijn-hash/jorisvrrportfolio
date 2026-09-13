import { ImageResponse } from "next/og";
import { SOLID, VIEWBOX } from "@/lib/logo";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon from the same polygon as the logo — solid (split 0), because a
 * detached tip disappears at 32px.
 */
export default function Icon() {
  const pts = SOLID.map(([x, y]) => `${(x / VIEWBOX) * 100}% ${(y / VIEWBOX) * 100}%`).join(", ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0B0B0A",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#F1EDE4",
            clipPath: `polygon(${pts})`,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
