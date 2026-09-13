import type { CSSProperties, ElementType, ReactNode } from "react";

export type Tone = "ink" | "ivory" | "burgundy" | "racing";

type Props = {
  tone?: Tone;
  as?: ElementType;
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
  /** Fill the viewport. Scenes that are title cards or openings use this. */
  full?: boolean;
  /** Vertical measure. Scenes are NOT uniformly spaced by design. */
  measure?: "none" | "tight" | "normal" | "loose";
};

const MEASURE: Record<string, string | undefined> = {
  none: undefined,
  tight: "clamp(4rem, 9vh, 7rem)",
  normal: "clamp(7rem, 16vh, 13rem)",
  loose: "clamp(10rem, 26vh, 20rem)",
};

/**
 * A SCENE — a full-bleed environment that owns 100vw and sets its own ground.
 *
 * Two rules this enforces that V1 got wrong:
 *   1. No centred wrapper. The scene is the viewport; content is placed on a
 *      viewport-wide grid (.vgrid) by column, not boxed into a max-width.
 *   2. No uniform rhythm. `measure` is chosen per scene so the sequence has
 *      pace — identical padding on every section is what made V1 read as a
 *      template.
 *
 * Tone flips the semantic token layer, so a burgundy scene is a ground change,
 * not a restyle — which is what makes the scene-to-scene colour changes read
 * as cuts between environments.
 */
export function Scene({
  tone = "ink",
  as: Tag = "section",
  children,
  className,
  id,
  style,
  full = false,
  measure = "normal",
}: Props) {
  return (
    <Tag
      id={id}
      data-tone={tone}
      data-scene=""
      className={`scene ${className ?? ""}`}
      style={{
        ...(full
          ? { minHeight: "100svh", display: "flex", flexDirection: "column" }
          : null),
        paddingBlock: MEASURE[measure],
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
