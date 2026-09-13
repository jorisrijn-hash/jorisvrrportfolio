"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useExperience, surfaceOf } from "@/lib/experience";
import { useSound } from "@/lib/sound";
import { Pill } from "./Pill";

/**
 * The persistent top bar, matching the reference:
 *   left   NEURAL NODE INTERFACE · LINK STABLE · [LOOP00] · sound pill
 *   right  ⟳ [REBUILD] (inverted)  [HOME]  [ABOUT]  [EXPT. LOGS]
 *
 * Navigation is disabled while a transition owns the screen, which is what
 * prevents double navigation and overlapping timelines.
 */
export function TopBar({ loop }: { loop: number }) {
  const { state, busy, go } = useExperience();
  const { enabled, setEnabled, cue } = useSound();
  const surface = surfaceOf(state);
  const on = enabled === true;

  return (
    <div className="hud-topbar">
      <div className="hud-topbar__left">
        <span>Neural Node Interface</span>
        <span className="hud-dot" aria-hidden="true" />
        <span>Link Stable</span>
        <span>[Loop{String(loop).padStart(2, "0")}]</span>
        <Pill
          onClick={() => {
            setEnabled(!on);
            if (!on) window.setTimeout(() => cue("toggle"), 60);
          }}
          aria-label={on ? "Turn sound off" : "Turn sound on"}
        >
          {on ? (
            <Volume2 size={11} strokeWidth={1.6} aria-hidden="true" />
          ) : (
            <VolumeX size={11} strokeWidth={1.6} aria-hidden="true" />
          )}
          {on ? "On" : "Off"}
        </Pill>
      </div>

      <nav className="hud-topbar__right" aria-label="Primary">
        {/* The reference only carries [REBUILD] on the home surface. */}
        {surface === "HOME" ? (
          <Pill invert spinner onClick={() => go("HOME")} disabled={busy}>
            [Rebuild]
          </Pill>
        ) : null}
        <Pill onClick={() => go("HOME")} current={surface === "HOME"} disabled={busy}>
          [Home]
        </Pill>
        <Pill onClick={() => go("ABOUT")} current={surface === "ABOUT"} disabled={busy}>
          [About]
        </Pill>
        <Pill onClick={() => go("WORK")} current={surface === "WORK"} disabled={busy}>
          [Expt. Logs]
        </Pill>
      </nav>
    </div>
  );
}
