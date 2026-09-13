"use client";

import { useEffect, useRef, useState } from "react";
import { ExperienceProvider, surfaceOf, useExperience } from "@/lib/experience";
import { dev } from "@/lib/dev";
import { useSound } from "@/lib/sound";
import { GridSystem } from "@/components/environment/GridSystem";
import { RegistrationMarks } from "@/components/environment/RegistrationMarks";
import { TopBar } from "@/components/hud/TopBar";
import { BootState } from "./BootState";
import { HomeState } from "./HomeState";
import { WorkState } from "./WorkState";
import { AboutState } from "./AboutState";

export function PortfolioExperience({ initial }: { initial?: "WORK" | "ABOUT" }) {
  return (
    <ExperienceProvider>
      <Stage initial={initial} />
    </ExperienceProvider>
  );
}

function Stage({ initial }: { initial?: "WORK" | "ABOUT" }) {
  const { state, bootDone, go, projectIndex } = useExperience();
  const { cue } = useSound();
  const [loop, setLoop] = useState(0);
  const surface = surfaceOf(state);
  const entered = useRef(false);

  // Deep link: /work and /about boot straight into their state.
  useEffect(() => {
    if (!initial || entered.current) return;
    if (state !== "HOME") return;
    entered.current = true;
    go(initial);
  }, [initial, state, go]);

  // Sound choreography: a cue when a state commits, another when it settles.
  const prev = useRef(state);
  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    if (before === state) return;
    if (state.endsWith("_IN") || state.endsWith("_OUT")) cue("navigate");
    if ((before.endsWith("_IN") || before.endsWith("_OUT")) && !state.includes("_")) cue("arrive");
    if (state === "HOME" && before === "BOOT") setLoop((l) => l + 1);
  }, [state, cue]);

  return (
    <div className="experience" data-state={state} data-surface={surface}>
      {/* Persistent environment. The grid is the base layer for every state;
          the centre construction belongs to the LOADING composition only —
          the reference home state does not carry it. */}
      <GridSystem />
      <RegistrationMarks />

      {/* The shard environment continues behind Work in the reference, but
          About replaces it with the globe on a clean ground. */}
      <HomeState
        active={state !== "BOOT" && surface !== "ABOUT"}
        chrome={state === "HOME"}
      />
      <div className="state-scrim" aria-hidden="true" />
      {surface === "WORK" ? (
        <WorkState phase={state === "WORK" ? "SETTLED" : state === "WORK_IN" ? "IN" : "OUT"} />
      ) : null}
      {surface === "ABOUT" ? (
        <AboutState phase={state === "ABOUT" ? "SETTLED" : state === "ABOUT_IN" ? "IN" : "OUT"} />
      ) : null}

      {/* persistent HUD */}
      {state !== "BOOT" ? (
        <div className="hud">
          <TopBar loop={loop} />
          {/* The loop readout is baked into mainbackground.mp4 (a screen
              recording) and that layer is now always present, so a DOM one
              would double up everywhere. */}
        </div>
      ) : null}

      <BootState onDone={bootDone} />

      {dev("SHOW_STATE") ? (
        <div className="dev-state">
          {state} · p{projectIndex}
        </div>
      ) : null}
    </div>
  );
}
