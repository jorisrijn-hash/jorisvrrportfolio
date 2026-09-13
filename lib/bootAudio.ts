"use client";

/**
 * The intro soundtrack — loadinganimation.mp3, Joris's own 17.152s track.
 *
 * Kept apart from the Cuelume interface cues: this is one long piece of scored
 * audio, not a UI response. It only ever starts behind an explicit consent, so
 * there is no autoplay and no AudioContext created speculatively.
 */
let el: HTMLAudioElement | null = null;

export function startBootTrack(volume = 0.55) {
  if (typeof window === "undefined") return;
  stopBootTrack();
  const a = new Audio();
  // opus first where supported; mp3 is the universal fallback
  a.src = a.canPlayType("audio/ogg; codecs=opus") ? "/audio/boot.opus" : "/audio/boot.mp3";
  a.volume = volume;
  a.preload = "auto";
  el = a;
  void a.play().catch(() => {
    /* refused — the sequence simply runs silent */
  });
}

/** Fade out rather than cut, so an early skip does not clip the track. */
export function stopBootTrack(fadeMs = 260) {
  const a = el;
  el = null;
  if (!a) return;
  const from = a.volume;
  const t0 = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / fadeMs);
    a.volume = from * (1 - k);
    if (k < 1) requestAnimationFrame(step);
    else a.pause();
  };
  requestAnimationFrame(step);
}
