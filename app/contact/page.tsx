import type { Metadata } from "next";
import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MotionText } from "@/components/primitives/MotionText";
import { ArrowLink } from "@/components/primitives/ArrowLink";
import { Footer } from "@/components/modules/Footer";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Joris van Rijn.",
};

export default function ContactPage() {
  return (
    <>
      <Section
        tone="burgundy"
        className="u-page"
        style={{ paddingTop: "clamp(7rem, 18vh, 12rem)", minHeight: "80svh" }}
      >
        <SectionLabel index="05">Contact</SectionLabel>

        <h1
          className="jvr-closing__lines"
          style={{ marginTop: "clamp(2rem, 7vh, 4rem)", fontSize: "var(--text-display-m)" }}
        >
          <MotionText as="span" split="line" stagger={0.1}>
            {"Open to internships,\ncollaboration and\ninteresting problems."}
          </MotionText>
        </h1>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem 2.5rem",
            marginTop: "clamp(2.5rem, 8vh, 4rem)",
          }}
        >
          <ArrowLink href={`mailto:${SITE.email}`} external>
            {SITE.email}
          </ArrowLink>
          <ArrowLink href="https://github.com/jorisrijn-hash" external>
            GitHub
          </ArrowLink>
        </div>

        <p className="u-micro" style={{ marginTop: "3rem", opacity: 0.75 }}>
          {SITE.location} — {SITE.availability}
        </p>
      </Section>
      <Footer />
    </>
  );
}
