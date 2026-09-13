import type { Metadata } from "next";
import Image from "next/image";
import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { ArrowLink } from "@/components/primitives/ArrowLink";
import { Footer } from "@/components/modules/Footer";
import { CAPABILITIES, SITE, TIMELINE } from "@/content/site";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "Joris van Rijn — multidisciplinary background across design, video, development and systems.",
};

/**
 * /profile is the ONE place photography is allowed (§7). Everything else on
 * the site stays typographic and illustrative.
 */
export default function ProfilePage() {
  return (
    <>
      <Section tone="ivory" className="u-page" style={{ paddingTop: "clamp(7rem, 18vh, 12rem)" }}>
        <SectionLabel index="04">Profile</SectionLabel>

        <div className="jvr-profile__head">
          <figure className="jvr-profile__portrait">
            <Image
              src="/img/joris-portrait.jpg"
              alt="Joris van Rijn"
              width={1024}
              height={1024}
              sizes="(min-width: 64rem) 40vw, 100vw"
              priority
            />
          </figure>

          <div className="jvr-profile__bio">
            <h1 style={{ fontSize: "var(--text-display-s)", fontWeight: 100, letterSpacing: "-0.03em", lineHeight: 1.05, color: "var(--on-surface)" }}>
              <MaskReveal>{SITE.name}</MaskReveal>
            </h1>
            <p>
              I work across <strong>design</strong>, <strong>development</strong> and
              the <strong>systems</strong> that connect them. That combination is
              deliberate: I have never found the interesting problems to be contained
              inside one of those.
            </p>
            <p>
              I came to software from video. Years of shooting and editing taught me
              pacing, framing, and how attention actually moves through a sequence —
              which turns out to describe most of interface design. From there into
              building websites and tools for small businesses, where I was
              responsible for the whole thing: the brief, the design, the code, the
              deployment, and the conversation when something broke.
            </p>
            <p>
              I am now studying ICT, business and data, which is the part I was
              missing — how software earns its place, how processes are actually
              shaped, and why data modelling is the quiet decision that determines
              everything downstream.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="ivory" className="u-page" style={{ paddingTop: 0 }}>
        <SectionLabel>Timeline</SectionLabel>
        <div style={{ marginTop: "clamp(1.5rem, 5vh, 2.5rem)" }}>
          {TIMELINE.map((row) => (
            <div key={row.title} className="jvr-timeline__row">
              <p className="u-micro" style={{ color: "var(--accent)" }}>{row.period}</p>
              <h2 className="jvr-timeline__title">{row.title}</h2>
              <p className="jvr-timeline__detail">{row.detail}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="ink" className="u-page">
        <SectionLabel>Capabilities</SectionLabel>
        <div className="jvr-caps">
          {CAPABILITIES.map((group) => (
            <div key={group.group} className="jvr-caps__group">
              <h2 className="u-mono" style={{ color: "var(--accent)" }}>{group.group}</h2>
              <ul className="jvr-caps__list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem 2.5rem", marginTop: "clamp(2.5rem, 8vh, 4rem)" }}>
          <ArrowLink href="/contact">Get in touch</ArrowLink>
          <ArrowLink href={`mailto:${SITE.email}`} external>{SITE.email}</ArrowLink>
        </div>
      </Section>
      <Footer />
    </>
  );
}
