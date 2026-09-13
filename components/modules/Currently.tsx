import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { CURRENTLY } from "@/content/site";

/**
 * 03 CURRENTLY (§17)
 *
 * Compensates for a portfolio that is not full yet by showing direction.
 * Presented as an editorial index — a mono label against a column of
 * statements — rather than three feature cards.
 */
export function Currently() {
  return (
    <Section tone="ivory" className="u-page" aria-labelledby="currently-heading">
      <SectionLabel index="03">Currently</SectionLabel>
      <h2 id="currently-heading" className="u-micro" style={{ position: "absolute", left: "-9999px" }}>
        What I am working on now
      </h2>

      <div style={{ marginTop: "clamp(2rem, 6vh, 3.5rem)" }}>
        {CURRENTLY.map((group) => (
          <div key={group.label} className="jvr-currently__row">
            <p className="u-mono" style={{ color: "var(--accent)" }}>
              {group.label}
            </p>
            <div className="jvr-currently__items">
              {group.items.map((item, i) => (
                <p key={item}>
                  <MaskReveal delay={i * 0.06}>{item}</MaskReveal>
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
