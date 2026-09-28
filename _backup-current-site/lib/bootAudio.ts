"use client";

/**
 * The intro soundtrack — loadinganimation.mp3, Joris's own 17.152s track.
 *
 * Kept apart from the Cuelume interface cues: this is one long piece of scored
 * audio, not a UI response. It only ever starts behind an explicit consent, so
 * there is no autoplay and no AudioContext created speculatively.
 */
import { onFirstGesture } from "./sound";

let el: HTMLAudioElement | null = null;

export function startBootTrack(volume = 0.55, offsetSeconds = 0) {
  if (typeof window === "undefined") return;
  stopBootTrack(0);
  const a = new Audio();
  // opus first where supported; mp3 is the universal fallback
  a.src = a.canPlayType("audio/ogg; codecs=opus") ? "/audio/boot.opus" : "/audio/boot.mp3";
  a.volume = volume;
  a.preload = "auto";
  // If consent arrives part-way through the sequence, join the track where the
  // visuals already are rather than restarting it underneath them.
  if (offsetSeconds > 0.15) {
    a.currentTime = offsetSeconds;
    a.addEventListener("loadedmetadata", () => { a.currentTime = offsetSeconds; }, { once: true });
  }
  el = a;

  // Autoplay may be refused until the page has been interacted with. If it is,
  // wait for the first gesture and join the track wherever the sequence has
  // reached by then, rather than giving up or restarting.
  void a.play().catch(() => {
    const started = performance.now();
    onFirstGesture(() => {
      if (el !== a) return; // a newer run took over
      const drift = (performance.now() - started) / 1000;
      a.currentTime = Math.min(a.duration || Infinity, offsetSeconds + drift);
      void a.play().catch(() => {});
    });
  });
}

/**
 * Fade out rather than cut, so an early skip does not clip the track.
 *
 * Stepped with setTimeout rather than requestAnimationFrame on purpose: the
 * custom cursor owns the only rAF loop in the application, and a volume ramp
 * does not need frame accuracy.
 */
export function stopBootTrack(fadeMs = 260) {
  const a = el;
  el = null;
  if (!a) return;
  if (fadeMs <= 0) {
    a.pause();
    return;
  }

  const steps = 8;
  const from = a.volume;
  for (let i = 1; i <= steps; i++) {
    setTimeout(() => {
      a.volume = Math.max(0, from * (1 - i / steps));
      if (i === steps) a.pause();
    }, (fadeMs / steps) * i);
  }
}
