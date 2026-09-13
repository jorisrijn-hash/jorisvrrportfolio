import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { WeightText } from "@/components/primitives/WeightText";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { POSITIONING } from "@/content/site";

/**
 * SCENE 02 — POSITIONING (Kexsio WEIGHT)
 *
 * Each discipline owns a row of the viewport at --text-scene. As the row rises
 * into frame its word gains mass — thin, then medium, then black — so the
 * argument is carried by the typography itself rather than by a paragraph
 * describing it. Notes sit in a narrow right column, tiny against the display.
 */
export function Positioning() {
  return (
    <Scene tone="ivory" measure="normal">
      <div style={{ paddingInline: "var(--gutter)", marginBottom: "clamp(2rem, 7vh, 4rem)" }}>
        <Meta style={{ color: "var(--on-surface-dim)" }}>02 / Positioning</Meta>
      </div>

      <h2 className="pos__lead" style={{ marginBottom: "clamp(2rem, 6vh, 3.5rem)" }}>
        <MaskReveal>I work between</MaskReveal>
      </h2>

      {POSITIONING.map((row, i) => (
        <div key={row.word} className="pos__row">
          <WeightText
            className="pos__word"
            from="thin"
            to={i === 0 ? "light" : i === 1 ? "medium" : "black"}
            offset={["start 0.95", "start 0.45"]}
          >
            {row.word}
          </WeightText>
          <p className="pos__note">{row.note}</p>
        </div>
      ))}
    </Scene>
  );
}
