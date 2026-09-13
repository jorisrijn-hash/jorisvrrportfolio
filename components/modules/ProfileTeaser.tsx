import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { ArrowLink } from "@/components/primitives/ArrowLink";
import { PROFILE_TEASER } from "@/content/site";

/** 06 PROFILE TEASER (§17). Concise — the biography belongs on /profile. */
export function ProfileTeaser() {
  return (
    <Section tone="ivory" className="u-page" aria-labelledby="profile-heading">
      <SectionLabel index="06">Profile</SectionLabel>

      <div className="jvr-teaser" style={{ marginTop: "clamp(2rem, 6vh, 3.5rem)" }}>
        <h2 id="profile-heading" className="jvr-teaser__lead">
          <MaskReveal>{PROFILE_TEASER.lead}</MaskReveal>
        </h2>
        <div>
          <p className="jvr-teaser__body">{PROFILE_TEASER.body}</p>
          <p style={{ marginTop: "2rem" }}>
            <ArrowLink href="/profile">Full profile</ArrowLink>
          </p>
        </div>
      </div>
    </Section>
  );
}
