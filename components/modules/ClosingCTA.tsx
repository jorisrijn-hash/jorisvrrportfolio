import { Section } from "@/components/primitives/Section";
import { MotionText } from "@/components/primitives/MotionText";
import { ArrowLink } from "@/components/primitives/ArrowLink";
import { CLOSING } from "@/content/site";

/**
 * 07 CLOSING (§17)
 *
 * The site's largest burgundy moment — burgundy as signature, not decoration.
 * Type does the work; no illustration is added just to fill the space (§8).
 */
export function ClosingCTA() {
  return (
    <Section tone="burgundy" as="section" flush aria-labelledby="closing-heading">
      <div className="u-page jvr-closing">
        <h2 id="closing-heading" className="jvr-closing__lines">
          <MotionText as="span" split="line" stagger={0.1}>
            {CLOSING.lines.join("\n")}
          </MotionText>
        </h2>
        <p className="jvr-closing__action">
          <ArrowLink href="/contact">{CLOSING.action}</ArrowLink>
        </p>
      </div>
    </Section>
  );
}
