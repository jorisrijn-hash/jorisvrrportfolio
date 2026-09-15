"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CRASH, CRASH_LINES } from "@/content/crash";
import { rng } from "@/lib/sculpture/math";
import { useSound } from "@/lib/sound";
import { stopBootTrack } from "@/lib/bootAudio";

type Stage = "glitch" | "panic" | "black";

/**
 * [REBUILD] — a staged, fake crash, then a full reset to the sound selection.
 *
 *   0.00  GLITCH  audio cuts, the sculpture freezes and tears (HomeStage),
 *                 tear bars flicker across the screen
 *   0.35  PANIC   a fault dump types out over the wreckage
 *   1.35  BLACK   power drops to black, REBOOTING
 *   2.15          everything resets to the sound selection (the gate)
 *
 * The overlay takes the pointer for its whole run, so nothing underneath can
 * be clicked while the screen is "down". Reduced motion keeps the panel and the
 * blackout but drops the tearing.
 */
export function CrashSequence({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<Stage>("glitch");
  const { cue } = useSound();
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);

  useEffect(() => {
    stopBootTrack(0);
    cue("crash");
    const timers = [
      window.setTimeout(() => setStage("panic"), CRASH.panic),
      window.setTimeout(() => {
        setStage("black");
        cue("toggle");
      }, CRASH.black),
      window.setTimeout(() => done.current(), CRASH.total),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [cue]);

  // Deterministic tear bars.
  const bars = useMemo(() => {
    const rand = rng(404);
    return Array.from({ length: 10 }, () => ({
      "--y": `${Math.round(rand() * 96)}%`,
      "--h": `${2 + Math.round(rand() * 16)}px`,
      "--x": `${Math.round((rand() - 0.5) * 80)}px`,
      "--a": (0.25 + rand() * 0.6).toFixed(2),
      "--dur": `${Math.round(140 + rand() * 260)}ms`,
      "--delay": `${Math.round(rand() * 300)}ms`,
    }));
  }, []);

  return (
    <div className="crash" data-stage={stage} role="status" aria-label="Restarting">
      <div className="crash__bars" aria-hidden="true">
        {bars.map((style, i) => (
          <i key={i} style={style as React.CSSProperties} />
        ))}
      </div>

      <div className="crash__panicwrap" aria-hidden="true">
        <div className="crash__panic">
          <p className="crash__title">{CRASH.title}</p>
          {CRASH_LINES.map((line, i) => (
            <p
              key={i}
              className="crash__line"
              style={{ ["--delay" as string]: `${i * 70}ms`, ["--steps" as string]: line.length }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="crash__black" aria-hidden="true">
        <p className="crash__reboot">{CRASH.reboot}</p>
      </div>
    </div>
  );
}
