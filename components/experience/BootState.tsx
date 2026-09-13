"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dev } from "@/lib/dev";
import { useSessionFlag, setSessionFlag } from "@/lib/clock";
import { useReducedMotion } from "@/lib/motion";
import { useSound } from "@/lib/sound";
import { Pill } from "@/components/hud/Pill";

const SESSION_KEY = "jvr.booted";
const BOOT_MS = 17150;

/** Phase beats measured from loadinganimation.mp4. */
const BEATS = [2200, 7500, 10500, 13000, 15000];

/**
 * BOOT — loadinganimation.mp4 (17.150s) with loadinganimation.mp3 (17.152s)
 * as its soundtrack.
 *
 * The layer is entirely non-interactive, so it plays the supplied asset rather
 * than a re-creation: that is the only way to stay frame-accurate to a
 * 17-second procedural sequence.
 *
 * Returning within the same session skips it; FORCE_INTRO replays it. The home
 * surface is already mounted underneath, so handover fades one layer out —
 * no white frame, no layout jump, no hydration pop.
 */
export function BootState({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const reduced = useReducedMotion();
  const { enabled, cue } = useSound();
  const audio = useRef<HTMLAudioElement | null>(null);
  const settled = useRef(false);

  const seen = useSessionFlag(SESSION_KEY);
  // null until mounted; then skip if already booted this session, unless the
  // dev flag forces a replay.
  const skip = seen === null ? null : dev("FORCE_INTRO") ? false : seen || reduced;

  const finish = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    setSessionFlag(SESSION_KEY, true);
    audio.current?.pause();
    cue("boot");
    setLeaving(true);
    window.setTimeout(() => {
      onDone();
      setGone(true); // unmount once handed over
    }, 420);
  }, [cue, onDone]);

  useEffect(() => {
    if (skip === null) return;
    if (skip) {
      finish();
      return;
    }
    const end = window.setTimeout(finish, BOOT_MS);
    const ticks = BEATS.map((ms) => window.setTimeout(() => cue("scan"), ms));
    return () => {
      window.clearTimeout(end);
      ticks.forEach(window.clearTimeout);
    };
  }, [skip, finish, cue]);

  // The soundtrack only plays if the user has already consented to sound.
  useEffect(() => {
    if (skip !== false || enabled !== true) return;
    const a = new Audio("/media/boot.mp3");
    a.volume = 0.35;
    audio.current = a;
    void a.play().catch(() => {});
    return () => a.pause();
  }, [skip, enabled]);

  if (skip === null || skip || gone) return null;

  return (
    <div className="boot" data-leaving={leaving} role="status" aria-label="System boot">
      <video
        src="/media/loadinganimation.mp4"
        poster="/media/boot-poster.jpg"
        muted
        playsInline
        autoPlay
        preload="auto"
        onEnded={finish}
      />
      <div className="boot__skip">
        <Pill onClick={finish}>[Skip]</Pill>
      </div>
    </div>
  );
}
