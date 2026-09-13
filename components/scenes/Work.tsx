import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { MaskReveal } from "@/components/primitives/MaskReveal";
import { TextLink } from "@/components/primitives/TextLink";
import { WORK } from "@/content/work";

/**
 * SCENE 05 — WORK
 *
 * Deliberately understated: there is not enough finished work to justify
 * importance, and faking it is worse than admitting it. No project grid, no
 * cards — a statement and one link.
 */
export function Work() {
  return (
    <Scene tone="ivory" measure="loose">
      <div style={{ paddingInline: "var(--gutter)", marginBottom: "clamp(2rem, 6vh, 3.5rem)" }}>
        <Meta style={{ color: "var(--on-surface-dim)" }}>05 / Work</Meta>
      </div>

      <h2 className="plain__type">
        <MaskReveal>Work in</MaskReveal>
        <MaskReveal delay={0.08}>progress.</MaskReveal>
      </h2>

      <div
        className="vgrid"
        style={{ marginTop: "clamp(2.5rem, 7vh, 4rem)", rowGap: "1.5rem" }}
      >
        <p className="plain__note col-full col-8-4">
          {WORK.length > 0
            ? `${WORK.length} project${WORK.length > 1 ? "s" : ""} published. Case studies cover the problem, the decisions and what changed.`
            : "Case studies are being written — the problem, the decisions, and what they changed. I would rather publish two properly than six in outline."}
        </p>
        <div className="col-full col-8-4">
          <TextLink href="/work">View work</TextLink>
        </div>
      </div>
    </Scene>
  );
}
