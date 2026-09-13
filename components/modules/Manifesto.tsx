import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { WeightText } from "@/components/primitives/WeightText";
import { MANIFESTO } from "@/content/site";

/**
 * 02 POSITIONING (§17)
 *
 * The one place WEIGHT carries the argument: the lead sits Thin, and the
 * claim resolves into Black. Structure, not decoration — the heavier line is
 * the one that matters.
 */
export function Manifesto() {
  return (
    <Section tone="ink" className="u-page" aria-labelledby="manifesto-heading">
      <SectionLabel index="02">Positioning</SectionLabel>

      <h2 id="manifesto-heading" className="jvr-manifesto__statement">
        <span className="jvr-manifesto__lead">
          <MaskReveal>{MANIFESTO.lead}</MaskReveal>
        </span>
        <WeightText
          className="jvr-manifesto__emph"
          from="thin"
          to="black"
          mode="cross"
          trigger="inView"
        >
          {MANIFESTO.emphasis}
        </WeightText>
      </h2>

      <div className="jvr-manifesto__body">
        {MANIFESTO.body.map((p, i) => (
          <p key={i}>
            <MaskReveal delay={0.1 + i * 0.08}>{p}</MaskReveal>
          </p>
        ))}
      </div>
    </Section>
  );
}
