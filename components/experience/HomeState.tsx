"use client";

import { MediaLayer } from "./MediaLayer";
import { SystemReadout } from "@/components/hud/SystemReadout";
import { ScrollCue } from "@/components/hud/ScrollCue";
import { SITE } from "@/content/site";

/**
 * HOME — the idle state.
 *
 * mainbackground.mp4 is the supplied background animation and loops as the
 * media layer (3.136s, seamless). It stays mounted for every state — in the
 * reference the same environment sits behind Work and About — while `chrome`
 * controls the HOME-only readout, version label and scroll cue.
 */
export function HomeState({ active, chrome }: { active: boolean; chrome: boolean }) {
  return (
    <>
      <MediaLayer
        src="/media/mainbackground.mp4"
        poster="/media/home-poster.jpg"
        visible={active}
        loop
      />
      {chrome ? (
        <>
          <SystemReadout />
          <div className="hud-version">[ Portfolio : Ver_ {SITE.version} ]</div>
          <ScrollCue />
        </>
      ) : null}
    </>
  );
}
