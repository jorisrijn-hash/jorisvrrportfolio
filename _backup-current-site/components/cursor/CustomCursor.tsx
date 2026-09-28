"use client";

import { useEffect, useRef } from "react";
import { dev } from "@/lib/dev";
import { useFinePointer, useReducedMotion } from "@/lib/motion";
import { addTick, removeTick } from "@/lib/ticker";

/** Elements carrying this attribute set the cursor state explicitly. */
const HIT = "[data-cursor], a[href], button, [role='button'], input, select, textarea";

/**
 * THE CURSOR
 *
 *   · position fixed at 0,0; moved only by transform
 *   · coordinates live in refs, never in React state
 *   · exact: the arrow IS the pointer (the native one is hidden), so it is
 *     never eased — any smoothing reads as input lag. Pointer events only
 *     record the target; the shared frame clock (lib/ticker) writes it once
 *     per frame, then unsubscribes until the pointer moves again
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
  const active = fine && !reduced && !dev("NO_CURSOR");

  useEffect(() => {
    const node = el.current;
    if (!active || !node) return;

    const root = document.documentElement;
    if (!dev("CUSTOM_CURSOR_DEBUG")) root.setAttribute("data-cursor-hidden", "true");

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let running = false;
    let visible = false;
    let state = "default";

    const frame = () => {
      node.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      running = false;
      removeTick(frame);
    };

    const kick = () => {
      if (running) return;
      running = true;
      addTick(frame);
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
      removeTick(frame);
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
