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
import { HomeStage, type StageMode } from "@/components/home/HomeStage";
import { HomeHud } from "@/components/home/HomeHud";
import { CrashSequence } from "@/components/home/CrashSequence";
import { AboutStage } from "@/components/about/AboutStage";

const SESSION_KEY = "jvr.booted";

export function Experience() {
  return (
    <ExperienceProvider>
      <Stage />
    </ExperienceProvider>
  );
}

function Stage() {
  const { state, runId, begin, skipToHome, ready, arrive, reboot, go } = useExperience();
  const seen = useSessionFlag(SESSION_KEY);
  const reduced = useReducedMotion();
  const still = reduced && !dev("FORCE_INTRO");

  // Returning within the same session skips both the gate and the sequence.
  // A replay (runId > 0) always shows them.
  useEffect(() => {
    if (state !== "gate" || seen === null) return;
    const shouldSkip = runId === 0 && !dev("FORCE_INTRO") && (seen || reduced);
    if (shouldSkip) skipToHome();
  }, [state, seen, reduced, runId, skipToHome]);

  // Home, and everything staged over it (the crash, About), keep HomeStage
  // mounted so its clock carries straight through.
  // Keys are namespaced per component: HomeStage and CrashSequence are
  // siblings during the crash, and sharing a bare runId key made React lose
  // track of HomeStage — it was never unmounted and its frozen drawing stayed
  // on screen under the next run.
  const inAbout = state === "to-about" || state === "about" || state === "to-home";
  const atHome = state === "loading-to-home" || state === "home" || state === "crash" || inAbout;
  const mode: StageMode = inAbout ? (state as StageMode) : "home";

  return (
    <div className="experience" data-state={state}>
      {/* The resting composition is mounted the whole time. From the handover
          on, its centre construction is drawn by the sculpture instead. */}
      <StaticComposition resolved={state !== "gate" && state !== "loading"} centre={!atHome} />

      {state === "loading" ? <BootSequence key={`boot-${runId}`} onDone={ready} /> : null}

      {/* Same element for loading-to-home, home, crash and About, so the
          timeline carries straight on without remounting. */}
      {atHome ? (
        <HomeStage
          key={`home-${runId}`}
          intro={state === "loading-to-home"}
          still={still}
          crashing={state === "crash"}
          mode={mode}
          onArrive={arrive}
        />
      ) : null}

      {inAbout ? (
        <AboutStage
          key={`about-${runId}`}
          leaving={state === "to-home"}
          still={still}
          onArrive={arrive}
          onClose={() => go("home")}
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

      {state === "crash" ? <CrashSequence key={`crash-${runId}`} onDone={reboot} /> : null}

      {dev("SHOW_STATE") ? <div className="dev-state">{state}</div> : null}
    </div>
  );
}
