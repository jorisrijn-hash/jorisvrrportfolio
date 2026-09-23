"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { PROJECT_BY_SLUG, hasCaseStudy } from "@/content/projects";
import { CrashSequence } from "@/components/home/CrashSequence";
import { load, loadWhenIdle, useStage } from "@/lib/stages";
import { useSound } from "@/lib/sound";

const SESSION_KEY = "jvr.booted";

const ABOUT_STATES = ["to-about", "about", "to-home", "work-to-about", "about-to-work"];
const WORK_STATES = ["home-to-work", "work", "work-to-home", "work-to-about", "about-to-work", "spotlight-to-work"];
/** Featured Work: the Work surface, scaled and set aside. */
const SPOTLIGHT_STATES = ["to-spotlight", "spotlight", "spotlight-to-home"];

/** How long the Work surface takes to become a case-study hero, in ms.
 *  The same number is in experience.css ([data-to-case]); the hero takes
 *  over the rectangle at the end of it. */
const CASE_OPEN = 760;
/** and how long the document takes to let the environment back through */
const CASE_CLOSE = 240;

type CaseView = { slug: string; phase: "opening" | "open" | "closing"; arrival: "carried" | "direct" };

/** The case study a URL is asking for, if it is one we can open. */
const caseFromPath = (path: string): string | null => {
  const m = /^\/work\/([^/?#]+)/.exec(path);
  const p = m ? PROJECT_BY_SLUG[m[1]] : undefined;
  return p && hasCaseStudy(p) ? p.slug : null;
};

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
  const Case = useStage("case")?.CaseStudy;
  const { warm } = useSound();
  useEffect(() => {
    if (state === "gate") void load("boot").catch(() => {});
    // On the Work environment, a case study is one click away.
    if (state === "work") loadWhenIdle("case");
    if (state === "home") {
      loadWhenIdle("work", "about");
      // past the gate: open the audio path now, not in the first cue
      warm();
    }
  }, [state, warm]);

  /* Arriving from a case study's own URL, "Work" promised the Work
     environment — so Home hands straight on to it, once, and the flag is
     spent on the way. */
  useEffect(() => {
    if (state !== "home") return;
    let asked = false;
    try {
      asked = sessionStorage.getItem("jvr.open") === "work";
      if (asked) sessionStorage.removeItem("jvr.open");
    } catch {}
    if (!asked) return;
    setSessionFlag(SPOTLIGHT.sessionKey, true);   // not on top of a request
    void load("work").then(() => go("work"), () => {});
  }, [state, go]);

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

  /* ---- case studies ------------------------------------------------------
     A case study is a route, not a modal: opening one pushes /work/<slug>,
     the browser's back button closes it, and a direct visit to that URL
     renders the same case study from its own page. What is *not* a route is
     the transition — the Work surface grows into the hero before the
     document exists, so the environment stays mounted underneath and closing
     hands the surface straight back to it. */
  const [caseView, setCaseView] = useState<CaseView | null>(null);
  // What is open, readable without waiting for a render — the URL and the
  // timers below are side effects, and side effects do not belong inside a
  // state updater (React runs those more than once).
  const caseNow = useRef<CaseView | null>(null);
  useEffect(() => { caseNow.current = caseView; }, [caseView]);

  const openCase = useCallback((slug: string) => {
    const p = PROJECT_BY_SLUG[slug];
    if (!p || !hasCaseStudy(p) || caseNow.current?.slug === slug) return;
    void load("case").catch(() => {});
    // From one case study into the next there is no surface to carry, so the
    // new one arrives by itself — and the URL moves either way. Going on from
    // one case study to another REPLACES the entry rather than stacking:
    // there is one case study in the history at a time, so back always means
    // the environment, wherever the chain of "next project" has led.
    const arrival: CaseView["arrival"] = caseNow.current ? "direct" : "carried";
    try {
      const url = `/work/${slug}`;
      if (arrival === "direct") window.history.replaceState({ case: slug }, "", url);
      else window.history.pushState({ case: slug }, "", url);
    } catch {}
    const next: CaseView = { slug, phase: arrival === "direct" ? "open" : "opening", arrival };
    caseNow.current = next;
    setCaseView(next);
    if (arrival === "carried") {
      window.setTimeout(() => {
        setCaseView((v) => (v && v.slug === slug && v.phase === "opening" ? { ...v, phase: "open" } : v));
      }, CASE_OPEN);
    }
  }, []);

  /** Let the environment back through, then drop the document. */
  const dismissCase = useCallback(() => {
    if (!caseNow.current || caseNow.current.phase === "closing") return;
    caseNow.current = { ...caseNow.current, phase: "closing" };
    setCaseView(caseNow.current);
    window.setTimeout(() => {
      caseNow.current = null;
      setCaseView((v) => (v?.phase === "closing" ? null : v));
    }, CASE_CLOSE);
  }, []);

  const closeCase = useCallback(() => {
    // The URL came from a push, so the back button is the honest way out.
    if (typeof window !== "undefined" && (window.history.state as { case?: string } | null)?.case) {
      window.history.back();
      return;
    }
    try { window.history.replaceState(null, "", "/"); } catch {}
    dismissCase();
  }, [dismissCase]);

  // Back and forward move between the environment and a case study.
  useEffect(() => {
    const onPop = () => {
      const slug = caseFromPath(window.location.pathname);
      if (slug) {
        void load("case").catch(() => {});
        if (caseNow.current?.slug === slug && caseNow.current.phase !== "closing") return;
        caseNow.current = { slug, phase: "open", arrival: "direct" };
        setCaseView(caseNow.current);
      } else {
        dismissCase();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [dismissCase]);

  // Escape leaves a case study, wherever focus is.
  useEffect(() => {
    if (!caseView || caseView.phase === "closing") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCase(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [caseView, closeCase]);

  const inCase = caseView !== null;
  const toCase = caseView !== null && caseView.phase !== "closing";

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
    <div
      className={`experience ${devClass}`.trim()}
      data-state={state}
      data-busy={busy || undefined}
      data-case={inCase ? caseView.phase : undefined}
    >
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
          paused={caseView?.phase === "open"}
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
          toCase={toCase}
          onOpenCase={openCase}
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

      {/* The document itself. It exists only once the surface has become its
          hero — until then there is nothing to read, only a move. */}
      {caseView && caseView.phase !== "opening" && Case ? (
        <Case
          key={`case-${caseView.slug}`}
          project={PROJECT_BY_SLUG[caseView.slug]}
          arrival={caseView.arrival}
          onBack={closeCase}
          onOpen={openCase}
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
