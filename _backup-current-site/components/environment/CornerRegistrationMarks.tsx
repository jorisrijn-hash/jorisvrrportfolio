/**
 * The thin L-brackets at the four extreme corners of loadingempty.png.
 * Pure CSS borders — four elements, no paint cost.
 */
export function CornerRegistrationMarks() {
  return (
    <div className="reg-marks" aria-hidden="true">
      <i data-c="tl" />
      <i data-c="tr" />
      <i data-c="bl" />
      <i data-c="br" />
    </div>
  );
}
