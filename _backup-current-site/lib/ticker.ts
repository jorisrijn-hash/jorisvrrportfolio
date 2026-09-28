"use client";

/**
 * THE FRAME CLOCK — the only requestAnimationFrame loop in the application.
 *
 * Everything that moves per frame (the cursor, the sculpture, the transition
 * timeline) subscribes here, so a frame is one callback pass rather than
 * several loops competing for the same vsync. The loop parks itself the moment
 * nothing is subscribed, so an idle page costs nothing.
 */
export type Tick = (now: number, dt: number) => void;

const subs = new Set<Tick>();
let raf = 0;
let last = 0;

function loop(now: number) {
  // Clamp dt so a backgrounded tab does not return with one enormous step.
  const dt = last ? Math.min(100, now - last) : 16.7;
  last = now;
  subs.forEach((fn) => fn(now, dt));
  if (subs.size) {
    raf = requestAnimationFrame(loop);
  } else {
    raf = 0;
    last = 0;
  }
}

export function addTick(fn: Tick): () => void {
  subs.add(fn);
  if (!raf && typeof window !== "undefined") raf = requestAnimationFrame(loop);
  return () => removeTick(fn);
}

export function removeTick(fn: Tick) {
  subs.delete(fn);
}
