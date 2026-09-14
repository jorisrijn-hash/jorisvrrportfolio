"use client";

import { useEffect, useRef } from "react";
import { dev } from "@/lib/dev";
import { useFinePointer, useReducedMotion } from "@/lib/motion";

/** Interpolation factor per frame. Lower is heavier. */
const SMOOTHING = 0.22;

/** Elements carrying this attribute set the cursor state explicitly. */
const HIT = "[data-cursor], a[href], button, [role='button'], input, select, textarea";

/**
 * THE CURSOR
 *
 *   · position fixed at 0,0; moved only by transform
 *   · coordinates live in refs, never in React state
 *   · ONE rAF loop, and it parks itself once caught up
 *   · hover state written straight to the DOM, so input never causes a render
 *   · pointer-events: none, so it can never intercept a click
 *
 * Position is fed by BOTH pointermove and mousemove, through one handler. On
 * some real hardware paths plain hover arrives as mousemove while pointermove
 * only fires during a drag — which makes a pointermove-only cursor follow just
 * while a button is held. No automated input reproduced that (Playwright,
 * including real Chrome against the live deploy), so neither feed is trusted
 * alone.
 *
 * It hides only when the pointer leaves the root element or the window loses
 * focus — never on pointerout. pointerout can report a null relatedTarget when
 * the element under a STATIONARY pointer is replaced, which the typewriter and
 * phase changes do constantly, and would leave the cursor hidden until the
 * next click.
 */
export function CustomCursor() {
  const el = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const active = fine && !reduced;

  useEffect(() => {
    const node = el.current;
    if (!active || !node) return;

    const root = document.documentElement;
    if (!dev("CUSTOM_CURSOR_DEBUG")) root.setAttribute("data-cursor-hidden", "true");

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

    const reveal = () => {
      if (visible) return;
      visible = true;
      node.dataset.visible = "true";
    };

    const hide = () => {
      visible = false;
      node.dataset.visible = "false";
    };

    /** The single entry point for every position source. */
    const point = (x: number, y: number) => {
      target.x = x;
      target.y = y;
      reveal();
      kick();
    };

    const onPointerMove = (e: PointerEvent) => point(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => point(e.clientX, e.clientY);

    const onOver = (e: PointerEvent) => {
      reveal();
      const hit = (e.target as Element | null)?.closest?.(HIT);
      const next = hit ? hit.getAttribute("data-cursor") || "link" : "default";
      if (next !== state) {
        state = next;
        node.dataset.state = next;
      }
    };

    const onDown = (e: PointerEvent) => {
      node.dataset.pressed = "true";
      point(e.clientX, e.clientY);
    };
    const onUp = () => {
      node.dataset.pressed = "false";
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    root.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      root.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
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
