"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { TracePanel } from "./TracePanel";
import { AuthBlock } from "./AuthBlock";
import { HexagonPair } from "./HexagonPair";
import { LoadingModule } from "./LoadingModule";
import { Checkerboard } from "./Checkerboard";
import { CompleteBadge } from "./CompleteBadge";
import { SignalBars } from "./SignalBars";
import { BOOT_TOTAL, PHASES, TRACE_A, TRACE_B, TRACE_C } from "@/content/boot";
import { dev } from "@/lib/dev";
import { useSessionFlag, setSessionFlag } from "@/lib/clock";
import { useReducedMotion } from "@/lib/motion";
import { useSound } from "@/lib/sound";

const SESSION_KEY = "jvr.booted";

type Phase = "trace" | "auth" | "complete" | "settle" | "done";

/**
 * THE BOOT SEQUENCE — rebuilt natively from loadinganimation.mp4.
 *
 * No video, no canvas. Phase boundaries were measured from the source's
 * ink-activity profile:
 *
 *   0.00 – 2.40  TRACE     three telemetry panels stream in
 *   2.50 – 7.70  AUTH      panels clear; hexagon expands, loading module runs
 *   7.80 – 10.40 COMPLETE  everything retracts, COMPLETE resolves at centre
 *  10.40 – 11.00 SETTLE    hands over to the resting composition
 *
 * One timer drives the phase; everything inside animates on transform/opacity
 * via Motion and CSS. There is no per-frame JavaScript.
 *
 * Returning within the same session skips straight to the resting state.
 * FORCE_INTRO replays it.
 */
export function BootSequence({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("trace");
  const [tick, setTick] = useState(0);
  /** The centre readout changes partway through phase 1, as in the source. */
  const [locked, setLocked] = useState(false);
  const reduced = useReducedMotion();
  const { cue } = useSound();
  const seen = useSessionFlag(SESSION_KEY);
  const settled = useRef(false);

  const skip = seen === null ? null : dev("FORCE_INTRO") ? false : seen || reduced;

  // Phase timeline. One setTimeout per boundary, cleared together.
  useEffect(() => {
    if (skip === null) return;

    if (skip) {
      if (!settled.current) {
        settled.current = true;
        setSessionFlag(SESSION_KEY, true);
        setPhase("done");
        onDone();
      }
      return;
    }

    cue("scan");
    const at = (ms: number, fn: () => void) => window.setTimeout(fn, ms);
    const timers = [
      at(1250, () => setLocked(true)),
      at(PHASES.auth.start, () => { setPhase("auth"); cue("scan"); }),
      at(PHASES.complete.start, () => { setPhase("complete"); cue("scan"); }),
      at(PHASES.settle.start, () => { setPhase("settle"); cue("arrive"); }),
      at(BOOT_TOTAL, () => {
        setPhase("done");
        setSessionFlag(SESSION_KEY, true);
        settled.current = true;
        onDone();
      }),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [skip, onDone, cue]);

  // Slow deterministic tick for the checkerboard. Only runs during AUTH.
  useEffect(() => {
    if (phase !== "auth") return;
    const id = window.setInterval(() => setTick((t) => t + 1), 420);
    return () => window.clearInterval(id);
  }, [phase]);

  if (skip === null || skip || phase === "done") return null;

  const isTrace = phase === "trace";
  const isAuth = phase === "auth";
  const isComplete = phase === "complete";

  return (
    <motion.div
      className="boot"
      animate={{ opacity: phase === "settle" ? 0 : 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      role="status"
      aria-label="System boot"
    >
      {/* PHASE 1 — telemetry */}
      <TracePanel
        {...TRACE_A}
        visible={isTrace}
        style={{ left: 63, top: 55, width: 592 }}
        stagger={0.05}
      />
      <TracePanel
        {...TRACE_B}
        visible={isTrace}
        style={{ left: 1320, top: 78, width: 525 }}
        delay={0.18}
        stagger={0.05}
      />
      <TracePanel
        {...TRACE_C}
        visible={isTrace}
        style={{ left: 63, top: 578, width: 692 }}
        delay={0.32}
        stagger={0.045}
      />
      <SignalBars visible={isTrace} />
      <motion.p
        className="boot__inbound"
        animate={{ opacity: isTrace ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        aria-hidden="true"
      >
        {locked ? "Inbound Signal Detected" : "Inbound · 2:U"}
      </motion.p>

      {/* PHASE 2 — authentication */}
      <AuthBlock visible={isAuth} />
      <div className="boot__hex"><HexagonPair visible={isAuth} /></div>
      <LoadingModule visible={isAuth} />
      <Checkerboard visible={isAuth} step={tick} />

      {/* PHASE 3 — complete */}
      <CompleteBadge visible={isComplete} />
    </motion.div>
  );
}
