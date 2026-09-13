import type { Metadata } from "next";
import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { ArrowLink } from "@/components/primitives/ArrowLink";
import { Footer } from "@/components/modules/Footer";
import { KIND_LABEL, LAB } from "@/content/lab";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Experiments, motion studies, graphics and small tools — documented as they are built.",
};

export default function LabPage() {
  return (
    <>
      <Section tone="ink" className="u-page" style={{ paddingTop: "clamp(7rem, 18vh, 12rem)" }}>
        <SectionLabel index="03">Lab</SectionLabel>

        <h1 className="jvr-empty__title" style={{ marginTop: "clamp(2rem, 6vh, 3.5rem)", fontSize: "var(--text-display-m)" }}>
          <MaskReveal>A working record.</MaskReveal>
        </h1>

        <p className="jvr-empty__body" style={{ marginTop: "1.5rem" }}>
          Interaction work, motion studies, generative graphics, data pieces and
          things written outside the browser. Smaller than a case study, and kept
          honest — including the ones that did not work.
        </p>

        {LAB.length > 0 ? (
          <div className="jvr-list" style={{ marginTop: "clamp(3rem, 9vh, 5rem)" }}>
            {LAB.map((entry) => (
              <article key={entry.slug} className="jvr-entry">
                <p className="u-micro" style={{ color: "var(--accent)" }}>{entry.index}</p>
                <h2 className="jvr-entry__title">
                  <MaskReveal>{entry.title}</MaskReveal>
                </h2>
                <p className="jvr-entry__summary">{entry.summary}</p>
                <p className="u-micro" style={{ color: "var(--on-surface-dim)" }}>
                  {KIND_LABEL[entry.kind]} — {entry.year}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="jvr-empty">
            <p className="jvr-empty__body">
              The first entries are being prepared. This page is built to grow — new
              experiments are added as single content entries, so publishing one is
              a matter of writing it, not rebuilding anything.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              <ArrowLink href="/contact">Get in touch</ArrowLink>
            </p>
          </div>
        )}
      </Section>
      <Footer />
    </>
  );
}
