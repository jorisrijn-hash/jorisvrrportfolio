"use client";

import { RotateCw, Volume2, VolumeX } from "lucide-react";
import { useExperience } from "@/lib/experience";
import { useSound } from "@/lib/sound";
import { stopBootTrack } from "@/lib/bootAudio";

/**
 * The home interface — deliberately restrained: name, sound, rebuild, and the
 * two destinations. It is always mounted during the transition and resolves
 * from CSS when the timeline raises [data-x-ui] on the stage, so revealing it
 * costs no React render.
 *
 * [REBUILD] fakes a crash and restarts the sequence. WORK and ABOUT are present
 * but inert until their checkpoints.
 */
export function HomeHud() {
  const { busy, crash } = useExperience();
  const { enabled, setEnabled, cue } = useSound();
  const on = enabled === true;

  return (
    <div className="home-hud">
      <div className="home-hud__id" data-reveal style={{ ["--d" as string]: "0ms" }}>
        <span className="home-hud__rule" aria-hidden="true" />
        <span className="home-hud__name">Joris van Rijn</span>
        <button
          type="button"
          className="home-pill home-pill--sound"
          aria-pressed={on}
          aria-label={on ? "Turn sound off" : "Turn sound on"}
          onPointerEnter={() => cue("hover")}
          onClick={() => {
            setEnabled(!on);
            // The intro score plays on past the handover, so switching sound
            // off here has to reach it too.
            if (on) stopBootTrack();
            else window.setTimeout(() => cue("toggle"), 60);
          }}
        >
          {on ? (
            <Volume2 size={10} strokeWidth={1.6} aria-hidden="true" />
          ) : (
            <VolumeX size={10} strokeWidth={1.6} aria-hidden="true" />
          )}
          <span>{on ? "On" : "Off"}</span>
        </button>
      </div>

      <p className="home-hud__title" data-reveal style={{ ["--d" as string]: "60ms" }}>
        <span>[ Portfolio : Ver_ 1.0.0 ]</span>
      </p>

      <nav className="home-hud__nav" aria-label="Primary">
        <button
          type="button"
          className="home-pill home-pill--dark"
          data-reveal
          style={{ ["--d" as string]: "120ms" }}
          disabled={busy}
          aria-label="Rebuild: restart the experience"
          onPointerEnter={() => cue("hover")}
          onClick={crash}
        >
          <RotateCw size={10} strokeWidth={1.8} aria-hidden="true" />
          <span>[Rebuild]</span>
        </button>
        <button
          type="button"
          className="home-pill"
          data-reveal
          style={{ ["--d" as string]: "180ms" }}
          aria-disabled="true"
          onPointerEnter={() => cue("hover")}
        >
          [Work]
        </button>
        <button
          type="button"
          className="home-pill"
          data-reveal
          style={{ ["--d" as string]: "240ms" }}
          aria-disabled="true"
          onPointerEnter={() => cue("hover")}
        >
          [About]
        </button>
      </nav>
    </div>
  );
}
