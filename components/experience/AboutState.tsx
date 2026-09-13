"use client";

import { useEffect } from "react";
import { MediaLayer } from "./MediaLayer";
import { useExperience } from "@/lib/experience";
import { ABOUT, SITE } from "@/content/site";

/**
 * ABOUT — reproduced from maintoabout.mp4.
 *
 * The reference resolves to a rotating globe with concentric orbit rings and
 * orbiting markers, over which two overlapping framed panels slide in, each
 * with corner handles. The globe keeps turning behind them.
 *
 * The globe itself is the supplied animation (a clean 1.15s stretch of the
 * source where the panels are retracted, looped). The panels and every word
 * in them are real DOM, so the copy is selectable, translatable and readable
 * by a screen reader.
 */
export function AboutState({ phase }: { phase: "IN" | "SETTLED" | "OUT" }) {
  const { go } = useExperience();

  useEffect(() => {
    if (phase !== "SETTLED") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") go("HOME");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, go]);

  return (
    <>
      <MediaLayer
        src="/media/maintoabout.mp4"
        poster="/media/about-poster.jpg"
        visible={phase === "IN"}
        restartOnShow
      />
      <MediaLayer
        className="about-globe"
        src="/media/about-globe.mp4"
        poster="/media/about-globe-poster.jpg"
        visible={phase === "SETTLED"}
        loop
      />

      {phase === "SETTLED" ? (
        <div className="about">
          <p className="about__module">Module // Profile_Node</p>

          {/* A — the opening line */}
          <section className="about__panel about__panel--a" aria-labelledby="about-lead">
            <Handles />
            <h2 id="about-lead" className="about__lead">
              {ABOUT.lead}
            </h2>
          </section>

          {/* B — short summary */}
          <section className="about__panel about__panel--b" aria-label="Summary">
            <Handles />
            <p className="about__summary">{ABOUT.summary}</p>
          </section>

          {/* C — metadata, then the longer text (this is the only place on the
              site where long-form copy appears, per the brief) */}
          <section className="about__panel about__panel--c" aria-label="Profile detail">
            <Handles />
            <dl className="about__meta">
              {ABOUT.meta.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="about__detail" style={{ marginTop: 14 }}>
              {ABOUT.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <p className="about__sig">
            {SITE.name} &middot; {SITE.location}
          </p>
        </div>
      ) : null}
    </>
  );
}

/** The corner handles the reference draws on every framed panel. */
function Handles() {
  return (
    <span className="handles" aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}
