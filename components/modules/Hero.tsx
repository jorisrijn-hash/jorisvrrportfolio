import { ArrowDown } from "lucide-react";
import { LogoMark } from "@/components/primitives/LogoMark";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { MotionText } from "@/components/primitives/MotionText";
import { HERO, SITE } from "@/content/site";

/**
 * 01 HERO (§17)
 *
 * Typography, the mark, and motion. No photography, no "Hi, I'm Joris".
 * The name is set in Thin at display-xl so the face itself is the graphic.
 */
export function Hero() {
  return (
    <section data-tone="ivory" className="u-page jvr-hero" aria-labelledby="hero-name">
      <div className="jvr-hero__top u-micro">
        <span>Index / 01</span>
        <span className="jvr-status">
          <span
            className="jvr-status__dot"
            style={{ background: "var(--status-available)" }}
            aria-hidden="true"
          />
          {SITE.availability}
        </span>
      </div>

      <div>
        <h1 id="hero-name" className="jvr-hero__name jvr-hero__lockup">
          <LogoMark size={64} gap={0.14} />
          <MotionText as="span" split="word" stagger={0.09}>
            {SITE.name}
          </MotionText>
        </h1>

        <div className="jvr-hero__bottom">
          <p className="jvr-hero__statement">
            <MaskReveal delay={0.35}>
              {HERO.statement}
            </MaskReveal>
          </p>
          <p className="jvr-hero__support">
            <MaskReveal delay={0.5}>
              {HERO.support}
            </MaskReveal>
          </p>
        </div>
      </div>

      <p className="jvr-scrollcue u-micro" aria-hidden="true">
        <ArrowDown size={13} strokeWidth={1.5} />
        Scroll
      </p>
    </section>
  );
}
