/**
 * The bracketed state label at top centre of loadingempty.png.
 *
 * Measured: corner brackets spanning x 796..1109, y 74..106 (arms ~34px),
 * with the label set between them at y ~84. In the reference this reads
 * HANDOFF-COMPLETE — it is the loading sequence's terminal state, which is
 * why loadingempty.png shows it.
 */
export function StateLabel({ children = "Handoff-Complete" }: { children?: string }) {
  return (
    <div className="state-label" aria-hidden="true">
      <span className="state-label__bracket" data-side="l" />
      <span className="state-label__text">{children}</span>
      <span className="state-label__bracket" data-side="r" />
    </div>
  );
}
