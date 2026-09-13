import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { MotionText } from "@/components/primitives/MotionText";
import { TextLink } from "@/components/primitives/TextLink";
import { Silk } from "@/components/primitives/Silk";
import { CLOSING, SITE } from "@/content/site";

/**
 * SCENE 08 — FINAL
 *
 * Full burgundy, with the silk field behind the type. The cursor disturbs the
 * cloth, so the last thing the visitor does on the page is touch it.
 */
export function Final() {
  return (
    <Scene tone="burgundy" full measure="none" className="final">
      <Silk className="final__silk" />

      <div className="final__inner">
        <Meta style={{ marginBottom: "clamp(2rem, 8vh, 4rem)", opacity: 0.72 }}>08 / Contact</Meta>

        <h2 className="final__type">
          <MotionText split="line" stagger={0.1}>
            {CLOSING.lines.join("\n")}
          </MotionText>
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem 2.5rem",
            alignItems: "baseline",
            marginTop: "clamp(2rem, 6vh, 3.5rem)",
          }}
        >
          <TextLink href="/contact">Contact</TextLink>
          <TextLink href={`mailto:${SITE.email}`} external>
            {SITE.email}
          </TextLink>
        </div>
      </div>
    </Scene>
  );
}
