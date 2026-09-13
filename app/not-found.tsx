import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { TextLink } from "@/components/primitives/TextLink";
import { LogoMark } from "@/components/primitives/LogoMark";

export default function NotFound() {
  return (
    <Scene tone="ink" full measure="none" style={{ justifyContent: "center", gap: "2rem" }}>
      <div style={{ paddingInline: "var(--gutter)", display: "grid", gap: "2rem" }}>
        <LogoMark size={36} split={0.6} />
        <Meta style={{ color: "var(--on-surface-dim)" }}>404 / Not found</Meta>
        <h1 className="plain__type" style={{ paddingInline: 0 }}>
          This page
          <br />
          does not exist.
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
          <TextLink href="/">Index</TextLink>
          <TextLink href="/work">Work</TextLink>
          <TextLink href="/lab">Lab</TextLink>
        </div>
      </div>
    </Scene>
  );
}
