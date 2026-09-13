"use client";

import { ExperienceProvider, useExperience } from "@/lib/experience";
import { dev } from "@/lib/dev";
import { StaticComposition } from "./StaticComposition";
import { BootSequence } from "@/components/boot/BootSequence";
import { SoundToggle } from "@/components/hud/SoundToggle";

export function Experience() {
  return (
    <ExperienceProvider>
      <Stage />
    </ExperienceProvider>
  );
}

function Stage() {
  const { state, ready } = useExperience();

  return (
    <div className="experience" data-state={state}>
      {/* The resting composition is mounted underneath the whole time, so the
          boot hands over by fading one layer out — no flash, no layout jump. */}
      <StaticComposition resolved={state !== "loading"} />

      <BootSequence onDone={ready} />

      <div className="hud-corner">
        <SoundToggle />
      </div>

      {dev("SHOW_STATE") ? <div className="dev-state">{state}</div> : null}
    </div>
  );
}
