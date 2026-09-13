import type { Metadata } from "next";
import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { ArrowLink } from "@/components/primitives/ArrowLink";
import { Footer } from "@/components/modules/Footer";
import { STATUS_LABEL, WORK } from "@/content/work";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected projects and case studies by Joris van Rijn.",
};

export default function WorkPage() {
  return (
    <>
      <Section tone="ivory" className="u-page" style={{ paddingTop: "clamp(7rem, 18vh, 12rem)" }}>
        <SectionLabel index="02">Work</SectionLabel>

        {WORK.length > 0 ? (
          <div className="jvr-list" style={{ marginTop: "clamp(2.5rem, 8vh, 4.5rem)" }}>
            <h1 style={{ position: "absolute", left: "-9999px" }}>Work</h1>
            {WORK.map((entry) => (
              <article key={entry.slug} className="jvr-entry">
                <p className="u-micro" style={{ color: "var(--accent)" }}>
                  {entry.year}
                </p>
                <h2 className="jvr-entry__title">
                  <MaskReveal>{entry.title}</MaskReveal>
                </h2>
                <p className="jvr-entry__summary">{entry.summary}</p>
                <p className="u-micro" style={{ color: "var(--on-surface-dim)" }}>
                  {STATUS_LABEL[entry.status]}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <>
            <h1 className="jvr-empty__title" style={{ marginTop: "clamp(2rem, 6vh, 3.5rem)", fontSize: "var(--text-display-m)" }}>
              <MaskReveal>Nothing published yet.</MaskReveal>
            </h1>
            <div className="jvr-empty">
              <p className="jvr-empty__body">
                Two projects are in progress and will be published as full case
                studies — the problem, the decisions, and what they changed. I would
                rather show that properly than list screenshots.
              </p>
              <p className="jvr-empty__body">
                In the meantime the Lab documents the work as it happens, and the
                profile covers the background.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginTop: "0.75rem" }}>
                <ArrowLink href="/lab">Lab</ArrowLink>
                <ArrowLink href="/profile">Profile</ArrowLink>
              </div>
            </div>
          </>
        )}
      </Section>
      <Footer />
    </>
  );
}
