type Props = {
  /** Zero-padded index, e.g. "02". */
  index?: string;
  children: React.ReactNode;
  className?: string;
};

/** Mono metadata: "02 / POSITIONING". Typography is the navigation language. */
export function SectionLabel({ index, children, className }: Props) {
  return (
    <p className={`u-mono ${className ?? ""}`} style={{ color: "var(--on-surface-dim)" }}>
      {index ? (
        <>
          <span style={{ color: "var(--accent)" }}>{index}</span>
          <span aria-hidden="true" style={{ padding: "0 0.6em", opacity: 0.5 }}>
            /
          </span>
        </>
      ) : null}
      {children}
    </p>
  );
}
