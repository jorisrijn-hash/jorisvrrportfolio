"use client";

import { useEffect } from "react";
import { ExperienceProvider, useExperience } from "@/lib/experience";
import { dev } from "@/lib/dev";
import { useSessionFlag, setSessionFlag, sessionFlag } from "@/lib/clock";
import { useReducedMotion } from "@/lib/motion";
import { StaticComposition } from "./StaticComposition";
import { Atmosphere } from "@/components/atmosphere/Atmosphere";
import { Vhs } from "@/components/atmosphere/Vhs";
import { FpsMeter } from "@/components/atmosphere/FpsMeter";
import { AudioGate } from "@/components/boot/AudioGate";
import { BootControls } from "@/components/hud/BootControls";
import { CustomCursor } from "@/components/cursor/CustomCursor";
import { HomeStage, type StageMode } from "@/components/home/HomeStage";
import { HomeHud } from "@/components/home/HomeHud";
import { Spotlight } from "@/components/home/Spotlight";
import { SPOTLIGHT } from "@/content/spotlight";
import { CrashSequence } from "@/components/home/CrashSequence";
import { load, loadWhenIdle, useStage } from "@/lib/stages";
import { useSound } from "@/lib/sound";

const SESSION_KEY = "jvr.booted";

const ABOUT_STATES = ["to-about", "about", "to-home", "work-to-about", "about-to-work"];
const WORK_STATES = ["home-to-work", "work", "work-to-home", "work-to-about", "about-to-work", "spotlight-to-work"];
/** Featured Work: the Work surface, scaled and set aside. */
const SPOTLIGHT_STATES = ["to-spotlight", "spotlight", "spotlight-to-home"];

export function Experience() {
  return (
    <ExperienceProvider>
      <Stage />
    </ExperienceProvider>
  );
}

function Stage() {
  const { state, busy, runId, begin, skipToHome, ready, arrive, reboot, go, spotlight, closeSpotlight } = useExperience();
  const seen = useSessionFlag(SESSION_KEY);
  const reduced = useReducedMotion();
  const still = reduced && !dev("FORCE_INTRO");

  const inAbout = ABOUT_STATES.includes(state);
  const inSpotlight = SPOTLIGHT_STATES.includes(state);
  const inWork = WORK_STATES.includes(state) || inSpotlight;
  const atHome = state === "loading-to-home" || state === "home" || state === "crash" || inAbout || inWork;


  // Heavy stages arrive when wanted (lib/stages): the boot sequence while the
  // gate is up, Work and About once Home has settled.
  const Boot = useStage("boot")?.BootSequence;
  const About = useStage("about")?.AboutStage;
  const Work = useStage("work")?.WorkStage;
  const { warm } = useSound();
  useEffect(() => {
    if (state === "gate") void load("boot").catch(() => {});
    if (state === "home") {
      loadWhenIdle("work", "about");
      // past the gate: open the audio path now, not in the first cue
      warm();
    }
  }, [state, warm]);

  // Home has settled: after a beat, the system surfaces one piece of work.
  // Once per session, never while the tab is hidden (the wait resumes when it
  // comes back), and never again once it has been closed or navigated away
  // from. The wait is also when the spotlight's preview quietly decodes.
  useEffect(() => {
    if (state !== "home") return;
    if (sessionFlag(SPOTLIGHT.sessionKey)) return;
    let timer = 0;
    const start = () => {
      window.clearTimeout(timer);
      if (document.visibilityState !== "visible") return;
      timer = window.setTimeout(() => {
        setSessionFlag(SPOTLIGHT.sessionKey, true);
        spotlight();
      }, SPOTLIGHT.delay);
    };
    void load("work").then((m) => m.preloadWork(), () => {});
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", start);
    };
  }, [state, spotlight]);

  // Escape closes the spotlight, wherever focus is.
  useEffect(() => {
    if (!inSpotlight) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSpotlight();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inSpotlight, closeSpotlight]);



  // Returning within the same session skips both the gate and the sequence.
  // A replay (runId > 0) always shows them.
  useEffect(() => {
    if (state !== "gate" || seen === null) return;
    const shouldSkip = runId === 0 && !dev("FORCE_INTRO") && (seen || reduced);
    if (shouldSkip) skipToHome();
  }, [state, seen, reduced, runId, skipToHome]);

  // Home, and everything staged over it (the crash, About, Work), keep
  // HomeStage mounted so its clock carries straight through. Between Work and
  // About both stages are mounted at once: one hands its surface to the other.
  // Keys are namespaced per component: HomeStage and CrashSequence are
  // siblings during the crash, and sharing a bare runId key made React lose
  // track of HomeStage — it was never unmounted and its frozen drawing stayed
  // on screen under the next run.

  const mode: StageMode = inAbout || inWork ? (state as StageMode) : "home";

  // Atmosphere reacts to transitions through this one attribute; the dev
  // classes only exist while tuning (both compile out of a build).
  const devClass = [
    dev("NO_HAZE") ? "no-haze" : "",
    dev("NO_MICRO") ? "no-micro" : "",
    dev("NO_AMBIENT") ? "no-ambient" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`experience ${devClass}`.trim()} data-state={state} data-busy={busy || undefined}>
      {/* The resting composition is mounted the whole time. From the handover
          on, its centre construction is drawn by the sculpture instead. */}
      <StaticComposition resolved={state !== "gate" && state !== "loading"} centre={!atHome} />

      {state === "loading" && Boot ? <Boot key={`boot-${runId}`} onDone={ready} /> : null}

      {/* Same element across home and everything staged over it, so the
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

      {inAbout && About ? (
        <About
          key={`about-${runId}`}
          leaving={state === "to-home" || state === "about-to-work"}
          leavingTo={state === "about-to-work" ? "work" : "home"}
          fromWork={state === "work-to-about"}
          still={still}
          onArrive={arrive}
          onClose={() => go("home")}
        />
      ) : null}

      {/* After About in the DOM, so Work's cells sit over the glass panels
          while one hands over to the other. */}
      {inWork && Work ? (
        <Work
          // The spotlight's surface IS this surface: one mount carries it
          // from Featured Work into the full Work environment.
          key={inSpotlight || state === "spotlight-to-work" ? `spotlight-${runId}` : `work-${runId}`}
          from={state === "about-to-work" ? "about" : "home"}
          leaving={state === "work-to-home" || state === "work-to-about" || state === "spotlight-to-home"}
          leavingTo={state === "work-to-about" ? "about" : "home"}
          still={still}
          onArrive={arrive}
          variant={inSpotlight || state === "spotlight-to-work" ? "spotlight" : "work"}
          toWork={state === "spotlight-to-work"}
        />
      ) : null}

      {inSpotlight ? (
        <Spotlight
          key={`spotlight-ui-${runId}`}
          closing={state === "spotlight-to-home"}
          onClose={closeSpotlight}
          onSeeAll={() => go("work")}
        />
      ) : null}

      {state === "gate" && seen !== null ? (
        <AudioGate
          onChoose={() => {
            setSessionFlag(SESSION_KEY, true);
            // Fetched as soon as the gate appeared; this only waits on a
            // slow first connection.
            void load("boot").then(begin, begin);
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

      {/* Analog interference, only while an About transition runs. */}
      <Vhs state={state} still={still} />

      {/* Over everything, under the cursor: grain, vignette, ambient light. */}
      <Atmosphere />

      {dev("SHOW_STATE") ? <div className="dev-state">{state}</div> : null}
      {dev("SHOW_FPS") ? <FpsMeter /> : null}
    </div>
  );
}
