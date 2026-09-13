"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "@/lib/sound";

/**
 * Persistent sound control (§12). Sound is never on until a real gesture,
 * so an undecided state reads as OFF here and turning it on is the gesture
 * that creates the AudioContext.
 */
export function SoundToggle({ className }: { className?: string }) {
  const { enabled, setEnabled, cue } = useSound();
  const on = enabled === true;

  return (
    <button
      type="button"
      className={`jvr-sound-toggle ${className ?? ""}`}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      onClick={() => {
        setEnabled(!on);
        if (!on) window.setTimeout(() => cue("toggle"), 60);
      }}
    >
      {on ? (
        <Volume2 size={14} strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <VolumeX size={14} strokeWidth={1.5} aria-hidden="true" />
      )}
      <span>Sound {on ? "on" : "off"}</span>
    </button>
  );
}
