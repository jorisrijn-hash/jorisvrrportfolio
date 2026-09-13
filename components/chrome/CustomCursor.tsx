"use client";

import { useEffect, useRef, useState } from "react";
import { SOLID, VIEWBOX, toPoints } from "@/lib/logo";
import { useFinePointer, useReducedMotion } from "@/lib/motion";

type State = "default" | "link" | "view" | "open" | "sound" | "menu";

const LABEL: Partial<Record<State, string>> = {
  view: "View",
  open: "Open",
  sound: "Sound",
  menu: "Menu",
};

/**
 * CUSTOM CURSOR (Kexsio INVERT).
 *
 * The cursor IS the mark — the same polygon as the logo, at 18px, rotated to
 * point the way a pointer does. Not a circle following the mouse.
 *
 * INVERT comes from mix-blend-mode: difference, so it reads correctly over
 * ink, ivory and burgundy with no per-scene logic. Contextual states expand it
 * into a labelled disc (VIEW / OPEN / SOUND), driven by `data-cursor-state`.
 *
 * Performance: one pointermove listener, one rAF that parks itself once the
 * cursor has caught up, and only `transform` is written per frame.
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
    let frame = 0;
    let running = false;

    const render = () => {
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      pos.x += dx * 0.22;
      pos.y += dy * 0.22;
      if (el.current) {
        el.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
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
      setVisible(true);
      kick();
    };

    const onOver = (e: PointerEvent) => {
      const hit = (e.target as Element | null)?.closest?.(
        "[data-cursor-state], a[href], button, [role='button'], input, textarea, select",
      );
      if (!hit) return setState("default");
      setState((hit.getAttribute("data-cursor-state") as State) ?? "link");
    };

    const onLeave = () => setVisible(false);

    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeAttribute("data-cursor");
    };
  }, [active]);

  if (!active) return null;

  const label = LABEL[state];
  const expanded = Boolean(label);
  const size = expanded ? 78 : state === "link" ? 30 : 18;

  return (
    <div ref={el} className="cursor" data-state={state} data-visible={visible} aria-hidden="true">
      <div
        style={{
          width: size,
          height: size,
          transition: "width .42s cubic-bezier(.16,1,.3,1), height .42s cubic-bezier(.16,1,.3,1)",
          position: "relative",
        }}
      >
        {expanded ? (
          <div style={{ width: "100%", height: "100%", background: "currentColor", borderRadius: "50%" }} />
        ) : (
          <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} width="100%" height="100%">
            <polygon points={toPoints(SOLID)} fill="currentColor" />
          </svg>
        )}
        {label ? <span className="cursor__label">{label}</span> : null}
      </div>
    </div>
  );
}
