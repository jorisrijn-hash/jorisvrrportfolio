import type { CSSProperties, ElementType, ReactNode } from "react";

export type Tone = "ivory" | "ink" | "burgundy" | "racing";

type Props = {
  tone?: Tone;
  as?: ElementType;
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
  /** Drops the default vertical rhythm for full-bleed compositions. */
  flush?: boolean;
  "aria-labelledby"?: string;
};

/**
 * The tone wrapper. Flips the SEMANTIC token layer (--surface, --on-surface,
 * --rule, --accent) for everything inside it, so a burgundy section is a token
 * swap rather than a restyle. This is what makes dark/light section switching
 * (§5) and the inverting cursor (§9) work without components knowing colours.
 */
export function Section({
  tone = "ivory",
  as: Tag = "section",
  children,
  className,
  id,
  style,
  flush = false,
  ...rest
}: Props) {
  return (
    <Tag
      id={id}
      data-tone={tone}
      className={className}
      style={{
        ...(flush ? null : { paddingBlock: "clamp(5rem, 12vh, 11rem)" }),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
