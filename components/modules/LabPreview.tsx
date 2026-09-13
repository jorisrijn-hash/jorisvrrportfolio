import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { ArrowLink } from "@/components/primitives/ArrowLink";
import { KIND_LABEL, LAB } from "@/content/lab";

/**
 * 05 LAB PREVIEW (§17, §19)
 *
 * Strategically the most important section while the portfolio is still
 * filling up — it is the part designed to grow over two years.
 */
export function LabPreview() {
  const entries = LAB.slice(0, 3);

  return (
    <Section tone="ink" className="u-page" aria-labelledby="lab-heading">
      <SectionLabel index="05">Lab</SectionLabel>

      {entries.length > 0 ? (
        <>
          <div className="jvr-list" style={{ marginTop: "clamp(2rem, 6vh, 3.5rem)" }}>
            <h2 id="lab-heading" style={{ position: "absolute", left: "-9999px" }}>
              Recent experiments
            </h2>
            {entries.map((entry) => (
              <article key={entry.slug} className="jvr-entry">
                <p className="u-micro" style={{ color: "var(--accent)" }}>{entry.index}</p>
                <h3 className="jvr-entry__title">
                  <MaskReveal>{entry.title}</MaskReveal>
                </h3>
                <p className="jvr-entry__summary">{entry.summary}</p>
                <p className="u-micro" style={{ color: "var(--on-surface-dim)" }}>
                  {KIND_LABEL[entry.kind]} — {entry.year}
                </p>
              </article>
            ))}
          </div>
          <p style={{ marginTop: "2.5rem" }}>
            <ArrowLink href="/lab">All experiments</ArrowLink>
          </p>
        </>
      ) : (
        <div className="jvr-empty">
          <h2 id="lab-heading" className="jvr-empty__title">
            A working record, not a highlight reel.
          </h2>
          <p className="jvr-empty__body">
            The Lab is where experiments, studies and small tools get documented as
            they are built — interaction work, motion, graphics, and things written
            outside the browser. First entries land shortly.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            <ArrowLink href="/lab">About the Lab</ArrowLink>
          </p>
        </div>
      )}
    </Section>
  );
}
