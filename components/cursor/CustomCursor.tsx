"use client";

import { useEffect, useRef } from "react";
import { dev } from "@/lib/dev";
import { useFinePointer, useReducedMotion } from "@/lib/motion";

/** Interpolation factor per frame. Lower is heavier. */
const SMOOTHING = 0.22;

/** Elements carrying this attribute set the cursor state explicitly. */
const HIT = "[data-cursor], a[href], button, [role='button'], input, select, textarea";

/**
 * THE CURSOR — rebuilt from zero.
 *
 * Rules this follows exactly:
 *   · position fixed at 0,0; moved only by transform
 *   · coordinates live in refs, never in React state
 *   · ONE rAF loop, and it is the only one in the application
 *   · zero React re-renders after mount — hover state is written straight to
 *     the DOM as a data attribute, not pushed through the component tree
 *   · pointer-events: none, so it can never intercept a click
 *
 * The mark is the brand arrowhead, not a circle. State comes from `data-cursor`
 * on whatever is under the pointer; CSS animates between states.
 *
 * The native cursor is hidden only once this is mounted and running, and
 * CUSTOM_CURSOR_DEBUG keeps it visible alongside for comparison.
 */
export function CustomCursor() {
  const el = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const active = fine && !reduced;

  useEffect(() => {
    const node = el.current;
    if (!active || !node) return;

    const debug = dev("CUSTOM_CURSOR_DEBUG");
    const root = document.documentElement;
    if (!debug) root.setAttribute("data-cursor-hidden", "true");

    // --- state kept out of React entirely ---------------------------------
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { ...target };
    let raf = 0;
    let running = false;
    let visible = false;
    let state = "default";

    const frame = () => {
      current.x += (target.x - current.x) * SMOOTHING;
      current.y += (target.y - current.y) * SMOOTHING;
      node.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;

      // Park the loop once it has caught up; no idle frames.
      if (Math.abs(target.x - current.x) < 0.05 && Math.abs(target.y - current.y) < 0.05) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        visible = true;
        node.dataset.visible = "true";
      }
      kick();
    };

    // Hover state is occasional, not per-frame, and is written directly to the
    // DOM so it never causes a render.
    const onOver = (e: PointerEvent) => {
      const hit = (e.target as Element | null)?.closest?.(HIT);
      const next = hit ? hit.getAttribute("data-cursor") || "link" : "default";
      if (next !== state) {
        state = next;
        node.dataset.state = next;
      }
    };

    const onDown = () => { node.dataset.pressed = "true"; };
    const onUp = () => { node.dataset.pressed = "false"; };
    const onLeave = () => { visible = false; node.dataset.visible = "false"; };
    const onEnter = () => { visible = true; node.dataset.visible = "true"; };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      root.removeAttribute("data-cursor-hidden");
    };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={el} className="cursor" data-state="default" data-visible="false" aria-hidden="true">
      <svg className="cursor__mark" viewBox="0 0 100 100" width="18" height="18">
        <polygon points="5,5 97,44 48,54 60,97" fill="currentColor" />
      </svg>
      <span className="cursor__ring" />
    </div>
  );
}
