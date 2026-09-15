"use client";

import { useEffect } from "react";
import { ExperienceProvider, useExperience } from "@/lib/experience";
import { dev } from "@/lib/dev";
import { useSessionFlag, setSessionFlag } from "@/lib/clock";
import { useReducedMotion } from "@/lib/motion";
import { StaticComposition } from "./StaticComposition";
import { AudioGate } from "@/components/boot/AudioGate";
import { BootSequence } from "@/components/boot/BootSequence";
import { BootControls } from "@/components/hud/BootControls";
import { CustomCursor } from "@/components/cursor/CustomCursor";
import { HomeStage } from "@/components/home/HomeStage";
import { HomeHud } from "@/components/home/HomeHud";

const SESSION_KEY = "jvr.booted";

export function Experience() {
  return (
    <ExperienceProvider>
      <Stage />
    </ExperienceProvider>
  );
}

function Stage() {
  const { state, runId, begin, skipToHome, ready, arrive } = useExperience();
  const seen = useSessionFlag(SESSION_KEY);
  const reduced = useReducedMotion();

  // Returning within the same session skips both the gate and the sequence.
  // A replay (runId > 0) always shows them.
  useEffect(() => {
    if (state !== "gate" || seen === null) return;
    const shouldSkip = runId === 0 && !dev("FORCE_INTRO") && (seen || reduced);
    if (shouldSkip) skipToHome();
  }, [state, seen, reduced, runId, skipToHome]);

  const atHome = state === "loading-to-home" || state === "home";

  return (
    <div className="experience" data-state={state}>
      {/* The resting composition is mounted the whole time. From the handover
          on, its centre construction is drawn by the sculpture instead. */}
      <StaticComposition resolved={state !== "gate" && state !== "loading"} centre={!atHome} />

      {state === "loading" ? <BootSequence key={runId} onDone={ready} /> : null}

      {/* Same element for loading-to-home and home, so the timeline carries
          straight on into the idle loop without remounting. */}
      {atHome ? (
        <HomeStage
          key={runId}
          intro={state === "loading-to-home"}
          still={reduced && !dev("FORCE_INTRO")}
          onArrive={arrive}
        />
      ) : null}

      {state === "gate" && seen !== null ? (
        <AudioGate
          onChoose={() => {
            setSessionFlag(SESSION_KEY, true);
            begin();
          }}
        />
      ) : null}

      <CustomCursor />

      {atHome ? (
        <HomeHud />
      ) : (
        <div className="hud-corner">
          <BootControls />
        </div>
      )}

      {dev("SHOW_STATE") ? <div className="dev-state">{state}</div> : null}
    </div>
  );
}
