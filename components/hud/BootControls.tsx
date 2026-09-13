"use client";

import { RotateCw, Volume2, VolumeX } from "lucide-react";
import { useExperience } from "@/lib/experience";
import { useSound } from "@/lib/sound";

/**
 * The two controls present in this pass: sound, and [REBUILD] to replay the
 * sequence — the latter taken from the home state of the reference, where the
 * same pill sits in the top bar.
 *
 * REBUILD is what makes the score reachable at all. Consent has to precede
 * audio, so a first visit is necessarily silent; without a way to run the
 * sequence again, the soundtrack could only ever be heard by someone who
 * happened to switch sound on inside the first eleven seconds of their very
 * first visit.
 */
export function BootControls() {
  const { enabled, setEnabled, cue } = useSound();
  const { state, replay } = useExperience();
  const on = enabled === true;

  return (
    <div className="boot-controls">
      <button
        type="button"
        className="ctl"
        aria-pressed={on}
        aria-label={on ? "Turn sound off" : "Turn sound on"}
        onPointerEnter={() => cue("hover")}
        onClick={() => {
          setEnabled(!on);
          if (!on) window.setTimeout(() => cue("toggle"), 60);
        }}
      >
        {on ? (
          <Volume2 size={11} strokeWidth={1.6} aria-hidden="true" />
        ) : (
          <VolumeX size={11} strokeWidth={1.6} aria-hidden="true" />
        )}
        <span>Sound {on ? "On" : "Off"}</span>
      </button>

      <button
        type="button"
        className="ctl"
        aria-label="Replay the boot sequence"
        disabled={state === "loading"}
        onPointerEnter={() => cue("hover")}
        onClick={() => {
          cue("select");
          replay();
        }}
      >
        <RotateCw size={11} strokeWidth={1.6} aria-hidden="true" />
        <span>[Rebuild]</span>
      </button>
    </div>
  );
}
