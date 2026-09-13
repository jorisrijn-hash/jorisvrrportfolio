import { Scene } from "@/components/primitives/Scene";
import { MotionText } from "@/components/primitives/MotionText";
import { STATEMENT } from "@/content/site";

/**
 * SCENE 03 — STATEMENT
 *
 * A full-burgundy title card and the composition's breathing point. One
 * thought, masked in line by line, nothing else on screen — no buttons, no
 * supporting copy, no container.
 */
export function Statement() {
  return (
    <Scene tone="burgundy" full measure="none" className="statement">
      <h2 className="statement__type">
        <MotionText split="line" stagger={0.11}>
          {STATEMENT.lines.join("\n")}
        </MotionText>
      </h2>
    </Scene>
  );
}
