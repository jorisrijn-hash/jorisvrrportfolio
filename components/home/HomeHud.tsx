"use client";

import { useEffect, useRef } from "react";
import { RotateCw, Volume2, VolumeX } from "lucide-react";
import { useExperience, type State } from "@/lib/experience";
import { useSound } from "@/lib/sound";
import { stopBootTrack } from "@/lib/bootAudio";
import { load } from "@/lib/stages";

// Hovering a destination fetches it: the stage's code, then its media.
const preloadWork = () => void load("work").then((m) => m.preloadWork(), () => {});
const preloadGlobe = () => load("about").then((m) => m.preloadGlobe(), () => null);

/** "[USER]: 0X92-MAC_OS_X_10_15_7" — the visitor's own OS token, plus a byte of hash. */
function userToken(ua: string) {
  const m = ua.match(/Windows NT [\d.]+|Mac OS X [\d_.]+|iPhone OS [\d_]+|CPU OS [\d_]+|Android [\d.]+|CrOS [\w.]+|Linux [\w_]+/);
  const os = (m?.[0] ?? "Unknown").replace(/[.\s]/g, "_").toUpperCase();
  let h = 0;
  for (let i = 0; i < ua.length; i++) h = (h * 31 + ua.charCodeAt(i)) & 0xff;
  return `0X${h.toString(16).toUpperCase().padStart(2, "0")}-${os}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The compact state indicator's wording. */
const STATE_LABEL: Partial<Record<State, string>> = {
  "loading-to-home": "Handoff",
  home: "Home · Idle",
  crash: "Fault",
  "home-to-work": "Routing → Work",
  work: "Work",
  "work-to-home": "Routing → Home",
  "to-about": "Routing → About",
  about: "About",
  "to-home": "Routing → Home",
  "work-to-about": "Routing → About",
  "about-to-work": "Routing → Work",
};

const DOCK_INDEX = { home: 0, work: 1, about: 2 } as const;

/**
 * The home interface. It is always mounted from the transition on and resolves
 * from CSS when the timeline raises [data-x-ui] on the stage, so revealing it
 * costs no React render. Live values (clock, loop count) are written straight
 * to their text nodes.
 *
 *   desktop  the reference top bar, telemetry block, title and pill nav
 *   compact  a slim top bar, the title and a state line over a bottom dock
 *            with a sliding indicator — the same controls, recomposed
 *
 * Only one of the two navigations is ever displayed, so the other leaves the
 * accessibility tree with it.
 *
 * Hover sounds answer a mouse only: a tap fires pointerenter too, and a touch
 * should be heard once, as its press.
 */
export function HomeHud() {
  const { state, busy, crash, go } = useExperience();
  const { enabled, setEnabled, cue } = useSound();
  const on = enabled === true;
  const at =
    state === "to-about" || state === "about" || state === "work-to-about"
      ? "about"
      : state === "home-to-work" || state === "work" || state === "about-to-work"
        ? "work"
        : "home";

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

  const hover = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") cue("hover");
  };

  const goTo = (to: "home" | "work" | "about") => {
    if (at === to) return;
    cue("select");
    // The destination's stage is normally in already (idle / hover); if not,
    // the transition starts the moment it lands, never half-mounted.
    if (to === "home") go(to);
    else void load(to).then(() => go(to), () => go(to));
  };

  const rebuild = () => {
    cue("select");
    crash();
  };

  const toggleSound = () => {
    setEnabled(!on);
    // The intro score plays on past the handover, so switching sound off here
    // has to reach it too.
    if (on) stopBootTrack();
    else window.setTimeout(() => cue("toggle"), 60);
  };

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
          onPointerEnter={hover}
          onClick={toggleSound}
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

      {/* ---- desktop navigation ---- */}
      <nav className="home-hud__nav" aria-label="Primary">
        <button
          type="button"
          className="home-pill home-pill--dark"
          data-reveal
          data-home-only
          style={{ ["--d" as string]: "120ms" }}
          disabled={busy || at !== "home"}
          aria-label="Rebuild: restart the experience"
          onPointerEnter={hover}
          onClick={rebuild}
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
          onPointerEnter={hover}
          onClick={() => goTo("home")}
        >
          [Home]
        </button>
        <button
          type="button"
          className="home-pill"
          data-reveal
          style={{ ["--d" as string]: "200ms" }}
          aria-current={at === "work" ? "page" : undefined}
          disabled={busy}
          onPointerEnter={(e) => {
            hover(e);
            preloadWork();
          }}
          onFocus={preloadWork}
          onClick={() => goTo("work")}
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
          onPointerEnter={(e) => {
            hover(e);
            void preloadGlobe();
          }}
          onFocus={() => void preloadGlobe()}
          onClick={() => goTo("about")}
        >
          [About]
        </button>
      </nav>

      {/* ---- compact: state line + bottom dock ---- */}
      <p className="home-state" data-reveal style={{ ["--d" as string]: "80ms" }} aria-live="polite">
        <i className="home-hud__dot" aria-hidden="true" />
        {"// "}
        {STATE_LABEL[state] ?? state}
      </p>

      <nav
        className="home-dock"
        aria-label="Primary"
        data-reveal
        data-busy={busy || undefined}
        style={{ ["--d" as string]: "120ms", ["--i" as string]: DOCK_INDEX[at] }}
      >
        <button
          type="button"
          className="home-dock__rebuild"
          disabled={busy || at !== "home"}
          aria-label="Rebuild: restart the experience"
          onClick={rebuild}
        >
          <RotateCw size={14} strokeWidth={1.7} aria-hidden="true" />
        </button>
        <div className="home-dock__items">
          <span className="home-dock__indicator" aria-hidden="true" />
          <button
            type="button"
            aria-current={at === "home" ? "page" : undefined}
            disabled={busy}
            onClick={() => goTo("home")}
          >
            [Home]
          </button>
          <button
            type="button"
            aria-current={at === "work" ? "page" : undefined}
            disabled={busy}
            onPointerDown={preloadWork}
            onClick={() => goTo("work")}
          >
            [Work]
          </button>
          <button
            type="button"
            aria-current={at === "about" ? "page" : undefined}
            disabled={busy}
            onPointerDown={() => void preloadGlobe()}
            onClick={() => goTo("about")}
          >
            [About]
          </button>
        </div>
      </nav>
    </div>
  );
}
