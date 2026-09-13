import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { TextLink } from "@/components/primitives/TextLink";
import { PROFILE_TEASER } from "@/content/site";

/**
 * SCENE 07 — PROFILE
 *
 * Typography only — no portrait on the homepage. Photography is reserved for
 * /profile. The line does the work; the explanation sits small beside it.
 */
export function Profile() {
  return (
    <Scene tone="ivory" measure="loose">
      <div style={{ paddingInline: "var(--gutter)", marginBottom: "clamp(2rem, 6vh, 3.5rem)" }}>
        <Meta style={{ color: "var(--on-surface-dim)" }}>07 / Profile</Meta>
      </div>

      <h2 className="plain__type">
        <MaskReveal>Before</MaskReveal>
        <MaskReveal delay={0.07}>software,</MaskReveal>
        <MaskReveal delay={0.14}>cameras.</MaskReveal>
      </h2>

      <div className="vgrid" style={{ marginTop: "clamp(2.5rem, 7vh, 4rem)", rowGap: "1.5rem" }}>
        <p className="plain__note col-full col-8-4">{PROFILE_TEASER.body}</p>
        <div className="col-full col-8-4">
          <TextLink href="/profile">Full profile</TextLink>
        </div>
      </div>
    </Scene>
  );
}
