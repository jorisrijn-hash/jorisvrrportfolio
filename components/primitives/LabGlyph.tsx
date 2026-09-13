/**
 * Generative geometry for a Lab entry — deterministic from its index, so the
 * same entry always draws the same figure and the set reads as one system.
 *
 * Line fields, traces and subdivisions rather than illustration: these are
 * diagrams of the territory, not decoration, and they carry the editorial
 * two-colour language (currentColor on the scene ground).
 */
export function LabGlyph({ seed, className }: { seed: number; className?: string }) {
  const rnd = mulberry(seed * 9301 + 49297);
  const W = 200;
  const H = 140;

  const kind = seed % 5;
  const parts: React.ReactNode[] = [];

  if (kind === 0) {
    // Type/Motion: a stack of rules that accelerate apart.
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      parts.push(
        <line key={i} x1={0} y1={H * t * t} x2={W * (0.35 + 0.65 * t)} y2={H * t * t} stroke="currentColor" strokeWidth={1} />,
      );
    }
  } else if (kind === 1) {
    // Network/Trace: nodes joined to their nearest neighbours.
    const pts = Array.from({ length: 9 }, () => [rnd() * W, rnd() * H] as const);
    pts.forEach(([x1, y1], i) =>
      pts.slice(i + 1).forEach(([x2, y2], j) => {
        if (Math.hypot(x2 - x1, y2 - y1) < 62) {
          parts.push(<line key={`l${i}-${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={0.75} opacity={0.65} />);
        }
      }),
    );
    pts.forEach(([x, y], i) => parts.push(<rect key={`n${i}`} x={x - 2} y={y - 2} width={4} height={4} fill="currentColor" />));
  } else if (kind === 2) {
    // Java/System: nested frames — scope inside scope.
    for (let i = 0; i < 5; i++) {
      const p = i * 12;
      parts.push(<rect key={i} x={p} y={p} width={W - p * 2} height={H - p * 2} fill="none" stroke="currentColor" strokeWidth={1} opacity={1 - i * 0.15} />);
    }
  } else if (kind === 3) {
    // Interaction: a field deflected around a point.
    for (let i = 0; i < 14; i++) {
      const x = (i / 13) * W;
      const d = Math.exp(-((x - W * 0.62) ** 2) / 1400) * 34;
      parts.push(<line key={i} x1={x} y1={0} x2={x} y2={H} stroke="currentColor" strokeWidth={0.75} transform={`translate(${d} 0)`} opacity={0.8} />);
    }
  } else {
    // Generative: subdivided cells, some filled.
    for (let i = 0; i < 24; i++) {
      const c = i % 6;
      const r = Math.floor(i / 6);
      if (rnd() > 0.55) {
        parts.push(<rect key={i} x={c * (W / 6)} y={r * (H / 4)} width={W / 6} height={H / 4} fill="currentColor" opacity={0.9} />);
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {parts}
    </svg>
  );
}

/** Small deterministic PRNG — no Math.random, so SSR and client agree. */
function mulberry(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
