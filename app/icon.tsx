import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon — the cursor-derived arrowhead, self-contained so it carries no
 * dependency on the experience's component tree.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#E8E8E8" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#1A1A1A",
            clipPath: "polygon(5% 5%, 97% 44%, 48% 54%, 60% 97%)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
