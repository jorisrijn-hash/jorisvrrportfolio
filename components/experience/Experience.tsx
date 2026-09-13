"use client";

import { ExperienceProvider, useExperience } from "@/lib/experience";
import { dev } from "@/lib/dev";
import { StaticComposition } from "./StaticComposition";
import { BootSequence } from "@/components/boot/BootSequence";
import { BootControls } from "@/components/hud/BootControls";

export function Experience() {
  return (
    <ExperienceProvider>
      <Stage />
    </ExperienceProvider>
  );
}

function Stage() {
  const { state, ready, runId } = useExperience();

  return (
    <div className="experience" data-state={state}>
      {/* The resting composition is mounted underneath the whole time, so the
          boot hands over by fading one layer out — no flash, no layout jump. */}
      <StaticComposition resolved={state !== "loading"} />

      {/* key on runId so a replay remounts the sequence cleanly */}
      <BootSequence key={runId} onDone={ready} replay={runId > 0} />

      <div className="hud-corner">
        <BootControls />
      </div>

      {dev("SHOW_STATE") ? <div className="dev-state">{state}</div> : null}
    </div>
  );
}
