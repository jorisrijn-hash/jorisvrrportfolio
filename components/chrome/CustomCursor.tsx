"use client";

import { useEffect, useRef, useState } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/motion";

type CursorState = "default" | "link" | "view";

/**
 * CUSTOM CURSOR (§14) — INVERT (§9)
 *
 * Inversion comes from mix-blend-mode: difference, so the cursor reads
 * correctly over ivory, ink and burgundy with no per-section logic.
 *
 * Performance (§25): ONE pointermove listener, ONE rAF loop, and only
 * `transform` is written — no layout is read or thrashed per frame. The loop
 * parks itself when the cursor has settled instead of running forever.
 *
 * It is never the only affordance: native cursors are hidden only while this
 * is mounted, and it does not mount on touch, coarse pointers, or under
 * reduced motion.
 */
export function CustomCursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);

  const active = fine && !reduced;

  useEffect(() => {
    if (!active) return;

    document.documentElement.setAttribute("data-cursor", "on");

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let frame = 0;
    let running = false;

    const render = () => {
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      pos.x += dx * 0.18;
      pos.y += dy * 0.18;

      if (dot.current) {
        dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }

      // Park the loop once it has caught up — no idle rAF burn.
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(render);
    };

    const kick = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) setVisible(true);
      kick();
    };

    const onOver = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(
        "a[href], button, [role='button'], input, textarea, select, [data-cursor-state]",
      );
      if (!el) {
        setState("default");
        return;
      }
      const explicit = el.getAttribute("data-cursor-state") as CursorState | null;
      setState(explicit ?? "link");
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      document.documentElement.removeAttribute("data-cursor");
    };
  }, [active, visible]);

  if (!active) return null;

  return (
    <div
      ref={dot}
      className="jvr-cursor"
      data-state={state}
      data-visible={visible ? "true" : "false"}
      aria-hidden="true"
    />
  );
}
