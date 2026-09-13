"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "@/lib/sound";

/**
 * The only control on screen this pass. Sound is opt-in: nothing plays, and no
 * AudioContext is created, until this is switched on.
 */
export function SoundToggle() {
  const { enabled, setEnabled, cue } = useSound();
  const on = enabled === true;

  return (
    <button
      type="button"
      className="sound-toggle"
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
  );
}
