import type { Metadata } from "next";
import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { MotionText } from "@/components/primitives/MotionText";
import { TextLink } from "@/components/primitives/TextLink";
import { Silk } from "@/components/primitives/Silk";
import { Footer } from "@/components/scenes/Footer";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Joris van Rijn.",
};

export default function ContactPage() {
  return (
    <>
      <Scene tone="burgundy" full measure="none" className="final">
        <Silk className="final__silk" />
        <div className="final__inner" style={{ paddingTop: "clamp(7rem, 20vh, 13rem)" }}>
          <Meta style={{ opacity: 0.72, marginBottom: "clamp(2rem, 8vh, 4rem)" }}>05 / Contact</Meta>
          <h1 className="final__type">
            <MotionText split="line" stagger={0.1}>
              {"Open to internships,\ncollaboration and\ninteresting problems."}
            </MotionText>
          </h1>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: "1rem 2.5rem", marginTop: "clamp(2.5rem, 8vh, 4rem)" }}
          >
            <TextLink href={`mailto:${SITE.email}`} external>{SITE.email}</TextLink>
            <TextLink href="https://github.com/jorisrijn-hash" external>GitHub</TextLink>
          </div>
          <Meta style={{ marginTop: "clamp(2rem, 6vh, 3rem)", opacity: 0.7 }}>
            {SITE.location} — {SITE.availability}
          </Meta>
        </div>
      </Scene>
      <Footer />
    </>
  );
}
