"use client";

import { useEffect, useRef } from "react";
import { RotateCw, Volume2, VolumeX } from "lucide-react";
import { useExperience } from "@/lib/experience";
import { useSound } from "@/lib/sound";
import { stopBootTrack } from "@/lib/bootAudio";
import { preloadGlobe } from "@/components/about/AboutStage";

/** "[USER]: 0X92-MAC_OS_X_10_15_7" — the visitor's own OS token, plus a byte of hash. */
function userToken(ua: string) {
  const m = ua.match(/Windows NT [\d.]+|Mac OS X [\d_.]+|iPhone OS [\d_]+|CPU OS [\d_]+|Android [\d.]+|CrOS [\w.]+|Linux [\w_]+/);
  const os = (m?.[0] ?? "Unknown").replace(/[.\s]/g, "_").toUpperCase();
  let h = 0;
  for (let i = 0; i < ua.length; i++) h = (h * 31 + ua.charCodeAt(i)) & 0xff;
  return `0X${h.toString(16).toUpperCase().padStart(2, "0")}-${os}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The home interface — the reference's top bar and telemetry block, the
 * portfolio title, and navigation. It is always mounted from the transition
 * on and resolves from CSS when the timeline raises [data-x-ui] on the stage,
 * so revealing it costs no React render. The live values (clock, loop count)
 * are written straight to their text nodes.
 *
 * WORK is present but inert until its checkpoint.
 */
export function HomeHud() {
  const { state, busy, crash, go } = useExperience();
  const { enabled, setEnabled, cue } = useSound();
  const on = enabled === true;
  const at = state === "to-about" || state === "about" ? "about" : "home";

  const user = useRef<HTMLSpanElement>(null);
  const unix = useRef<HTMLParagraphElement>(null);
  const iso = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (user.current) user.current.textContent = userToken(navigator.userAgent);
    const tick = () => {
      const d = new Date();
      if (unix.current) unix.current.textContent = String(Math.floor(d.getTime() / 1000));
      if (iso.current) {
        iso.current.textContent =
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
          `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="home-hud">
      <div className="home-hud__bar" data-reveal style={{ ["--d" as string]: "0ms" }}>
        <span className="home-hud__rule" aria-hidden="true" />
        <span>Neural Node Interface</span>
        <span className="home-hud__link">
          <i className="home-hud__dot" aria-hidden="true" />
          Link Stable
        </span>
        <span aria-label="Loop count">
          [Loop<span data-loop>00</span>]
        </span>
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

      <div className="home-hud__telemetry" data-reveal data-home-only style={{ ["--d" as string]: "40ms" }} aria-hidden="true">
        <p className="home-hud__t-user">[User]: <span ref={user} /></p>
        <i className="home-hud__t-tick" />
        <p className="home-hud__t-module"># Module:// Chronod</p>
        <p className="home-hud__t-facility">Facility=Neural_Node/Chrono_Daemon · PID=4182</p>
        <p ref={unix} className="home-hud__t-unix" />
        <p ref={iso} className="home-hud__t-iso" />
      </div>

      <p className="home-hud__title" data-reveal data-home-only style={{ ["--d" as string]: "60ms" }}>
        <span>[ Portfolio : Ver_ 1.0.0 ]</span>
      </p>

      <nav className="home-hud__nav" aria-label="Primary">
        <button
          type="button"
          className="home-pill home-pill--dark"
          data-reveal
          data-home-only
          style={{ ["--d" as string]: "120ms" }}
          disabled={busy || at !== "home"}
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
          style={{ ["--d" as string]: "160ms" }}
          aria-current={at === "home" ? "page" : undefined}
          disabled={busy}
          onPointerEnter={() => cue("hover")}
          onClick={() => {
            if (at === "home") return;
            cue("select");
            go("home");
          }}
        >
          [Home]
        </button>
        <button
          type="button"
          className="home-pill"
          data-reveal
          style={{ ["--d" as string]: "200ms" }}
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
          aria-current={at === "about" ? "page" : undefined}
          disabled={busy}
          onPointerEnter={() => {
            cue("hover");
            void preloadGlobe();
          }}
          onFocus={() => void preloadGlobe()}
          onClick={() => {
            if (at === "about") return;
            cue("select");
            go("about");
          }}
        >
          [About]
        </button>
      </nav>
    </div>
  );
}
