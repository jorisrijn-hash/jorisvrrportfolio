import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { ArrowLink } from "@/components/primitives/ArrowLink";
import { STATUS_LABEL, featuredWork } from "@/content/work";

/**
 * 04 FEATURED (§17)
 *
 * One project, or none. The empty state is deliberate rather than apologetic:
 * it says what is coming and sends the reader to the Lab, which is the honest
 * evidence right now (§31).
 */
export function FeaturedWork() {
  const entry = featuredWork();

  return (
    <Section tone="ivory" className="u-page" aria-labelledby="featured-heading">
      <SectionLabel index="04">Selected work</SectionLabel>

      {entry ? (
        <div style={{ marginTop: "clamp(2rem, 6vh, 3.5rem)" }}>
          <h2 id="featured-heading" className="jvr-empty__title">
            <MaskReveal>{entry.title}</MaskReveal>
          </h2>
          <p className="jvr-empty__body" style={{ marginTop: "1rem" }}>
            {entry.summary}
          </p>
          <p className="u-micro" style={{ marginTop: "1.25rem", color: "var(--on-surface-dim)" }}>
            {STATUS_LABEL[entry.status]} — {entry.year} — {entry.disciplines.join(" / ")}
          </p>
          <p style={{ marginTop: "2rem" }}>
            <ArrowLink href={`/work/${entry.slug}`}>Read the case study</ArrowLink>
          </p>
        </div>
      ) : (
        <div className="jvr-empty">
          <h2 id="featured-heading" className="jvr-empty__title">
            The first case studies are being written.
          </h2>
          <p className="jvr-empty__body">
            I would rather publish two projects properly than six in outline. Until
            they are ready, the Lab is the better picture of how I work.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            <ArrowLink href="/lab">Go to the Lab</ArrowLink>
          </p>
        </div>
      )}
    </Section>
  );
}
