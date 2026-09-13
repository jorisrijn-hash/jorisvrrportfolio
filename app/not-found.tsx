import { Section } from "@/components/primitives/Section";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { ArrowLink } from "@/components/primitives/ArrowLink";
import { LogoMark } from "@/components/primitives/LogoMark";

export default function NotFound() {
  return (
    <Section
      tone="ink"
      className="u-page"
      style={{ minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center", gap: "2rem" }}
    >
      <LogoMark size={40} gap={0.14} />
      <SectionLabel index="404">Not found</SectionLabel>
      <h1 style={{ fontSize: "var(--text-display-m)", fontWeight: 100, letterSpacing: "-0.035em", lineHeight: 0.95, maxWidth: "16ch" }}>
        This page does not exist.
      </h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem 2.5rem" }}>
        <ArrowLink href="/">Index</ArrowLink>
        <ArrowLink href="/work">Work</ArrowLink>
        <ArrowLink href="/lab">Lab</ArrowLink>
      </div>
    </Section>
  );
}
