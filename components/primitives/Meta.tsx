type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Mono metadata — "01 / INDEX", "NL — 2026". The ONLY job of the mono face
 * (§typography): tiny system information that gives the display type something
 * to be enormous against.
 */
export function Meta({ children, className, style }: Props) {
  return (
    <p className={`u-micro ${className ?? ""}`} style={style}>
      {children}
    </p>
  );
}
