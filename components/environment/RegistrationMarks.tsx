/**
 * Corner registration marks — the L-brackets in loadingempty.png.
 * Pure CSS borders, one element per corner, so they cost nothing.
 */
export function RegistrationMarks() {
  return (
    <div className="env-marks" aria-hidden="true">
      <i data-c="tl" />
      <i data-c="tr" />
      <i data-c="bl" />
      <i data-c="br" />
    </div>
  );
}
