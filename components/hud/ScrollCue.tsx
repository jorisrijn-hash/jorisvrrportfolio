export function ScrollCue({ label = "Scroll" }: { label?: string }) {
  return (
    <div className="hud-scroll" aria-hidden="true">
      <span className="hud-scroll__mark" />
      <span>{label}</span>
    </div>
  );
}
