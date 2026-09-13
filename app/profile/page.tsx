import type { Metadata } from "next";
import Image from "next/image";
import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { TextLink } from "@/components/primitives/TextLink";
import { Footer } from "@/components/scenes/Footer";
import { CAPABILITIES, SITE, TIMELINE } from "@/content/site";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "Joris van Rijn — multidisciplinary background across design, video, development and systems.",
};

/** /profile is the ONE route where photography appears. */
export default function ProfilePage() {
  return (
    <>
      <Scene tone="ivory" measure="normal" style={{ paddingTop: "clamp(7rem, 20vh, 13rem)" }}>
        <div style={{ paddingInline: "var(--gutter)", marginBottom: "clamp(2rem, 6vh, 3.5rem)" }}>
          <Meta style={{ color: "var(--on-surface-dim)" }}>04 / Profile</Meta>
        </div>

        <h1 className="plain__type">
          <MaskReveal>Joris</MaskReveal>
          <MaskReveal delay={0.08}>van Rijn</MaskReveal>
        </h1>

        <div className="vgrid" style={{ marginTop: "clamp(3rem, 9vh, 5rem)", rowGap: "2.5rem" }}>
          <figure className="portrait col-full col-1-5">
            <Image
              src="/img/joris-portrait.jpg"
              alt="Joris van Rijn"
              width={1024}
              height={1024}
              sizes="(min-width: 64rem) 40vw, 100vw"
              priority
            />
          </figure>

          <div className="bio col-full col-7-5">
            <p>
              I work across <strong>design</strong>, <strong>development</strong> and the{" "}
              <strong>systems</strong> that connect them. That combination is deliberate:
              I have never found the interesting problems to be contained inside one of those.
            </p>
            <p>
              I came to software from video. Years of shooting and editing taught me pacing,
              framing, and how attention actually moves through a sequence — which turns out
              to describe most of interface design. From there into building websites and
              tools for small businesses, where I was responsible for the whole thing: the
              brief, the design, the code, the deployment, and the conversation when
              something broke.
            </p>
            <p>
              I am now studying ICT, business and data, which is the part I was missing —
              how software earns its place, how processes are actually shaped, and why data
              modelling is the quiet decision that determines everything downstream.
            </p>
          </div>
        </div>
      </Scene>

      <Scene tone="ivory" measure="tight">
        <div style={{ paddingInline: "var(--gutter)" }}>
          <Meta style={{ color: "var(--on-surface-dim)", marginBottom: "1.5rem" }}>Timeline</Meta>
          {TIMELINE.map((row) => (
            <div key={row.title} className="tl__row">
              <Meta style={{ color: "var(--accent)" }}>{row.period}</Meta>
              <h2 className="tl__title">{row.title}</h2>
              <p className="plain__note">{row.detail}</p>
            </div>
          ))}
        </div>
      </Scene>

      <Scene tone="ink" measure="normal">
        <div style={{ paddingInline: "var(--gutter)" }}>
          <Meta style={{ color: "var(--on-surface-dim)" }}>Capabilities</Meta>
        </div>
        <div className="vgrid" style={{ marginTop: "clamp(2rem, 6vh, 3rem)", rowGap: "2rem" }}>
          {CAPABILITIES.map((group, i) => (
            <div key={group.group} className={`col-full ${i === 0 ? "col-1-5" : i === 1 ? "col-7-5" : "col-1-5"}`}>
              <Meta style={{ color: "var(--accent)", marginBottom: "0.75rem" }}>{group.group}</Meta>
              <ul className="caps__list">
                {group.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ paddingInline: "var(--gutter)", marginTop: "clamp(2.5rem, 8vh, 4rem)", display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
          <TextLink href="/contact">Get in touch</TextLink>
          <TextLink href={`mailto:${SITE.email}`} external>{SITE.email}</TextLink>
        </div>
      </Scene>
      <Footer />
    </>
  );
}
