"use client";

import { useEffect, useRef, useState } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/motion";

type State = "default" | "active" | "view" | "open" | "back";

const LABEL: Partial<Record<State, string>> = { view: "View", open: "Open", back: "Back" };

/**
 * The cursor is the brand pointer: a hairline arrowhead with a detachable tip,
 * not a circle. It has real states, and it animates between them.
 *
 * Performance: one pointermove listener, one rAF that parks itself once the
 * cursor has caught up, transform-only writes.
 */
export function CustomCursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const el = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("default");
  const [visible, setVisible] = useState(false);
  const active = fine && !reduced;

  useEffect(() => {
    if (!active) return;
    document.documentElement.setAttribute("data-cursor", "on");

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const pos = { ...target };
    let raf = 0;
    let running = false;

    const render = () => {
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      pos.x += dx * 0.24;
      pos.y += dy * 0.24;
      if (el.current) {
        el.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      }
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) { running = false; return; }
      raf = requestAnimationFrame(render);
    };
    const kick = () => { if (!running) { running = true; raf = requestAnimationFrame(render); } };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX; target.y = e.clientY;
      setVisible(true); kick();
    };
    const onOver = (e: PointerEvent) => {
      const hit = (e.target as Element | null)?.closest?.(
        "[data-cursor-state], a[href], button, [role='button'], input, select, textarea",
      );
      if (!hit) return setState("default");
      setState((hit.getAttribute("data-cursor-state") as State) ?? "active");
    };
    const onLeave = () => setVisible(false);

    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeAttribute("data-cursor");
    };
  }, [active]);

  if (!active) return null;
  const label = LABEL[state];

  return (
    <div ref={el} className="cursor" data-state={state} data-visible={visible} aria-hidden="true">
      <svg viewBox="0 0 100 100" width="17" height="17" className="cursor__mark">
        <polygon points="5,5 97,44 48,54 60,97" fill="currentColor" />
      </svg>
      <span className="cursor__ring" />
      {label ? <span className="cursor__label">{label}</span> : null}
    </div>
  );
}
