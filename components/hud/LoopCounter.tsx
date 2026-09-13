/**
 * Bottom-right loop counter. Outlined numerals with a slashed zero, matching
 * the reference — drawn with -webkit-text-stroke rather than an image so it
 * stays crisp and can animate.
 */
export function LoopCounter({ value }: { value: number }) {
  return (
    <div className="hud-loop" aria-label={`Loop ${value}`}>
      <span className="hud-loop__tick" aria-hidden="true" />
      <div className="hud-loop__label">Loop:</div>
      <div className="hud-loop__value" aria-hidden="true">
        {String(value).padStart(2, "0").replace(/0/g, "Ø")}
      </div>
    </div>
  );
}
