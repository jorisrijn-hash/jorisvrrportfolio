"use client";

import { useEffect, useRef } from "react";

/**
 * THE CROSSHAIR — a precision instrument, not a decorative cursor.
 *
 * Two hairlines and a dot, a few pixels across. It follows the pointer on the
 * compositor (one transform, written once per frame) and changes only when it
 * is over something that does something: a little wider over a link, a ring
 * over a project. It never grows into a blob, never carries a label, and
 * never covers what it is pointing at.
 *
 * It exists only where there is a real pointer: no touch screen gets one, and
 * the native cursor is only hidden once this is actually on screen, so a
 * failure here can never leave a page with no cursor at all.
 */
export function Crosshair() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)");
    if (!fine.matches) return;

    const root = document.documentElement;
    root.dataset.cursor = "on";

    let frame = 0;
    let x = 0;
    let y = 0;
    const write = () => {
      frame = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!el.dataset.on) el.dataset.on = "1";
      if (!frame) frame = requestAnimationFrame(write);

      // what is under it decides how it looks — read from the element itself
      const t = (e.target as HTMLElement | null)?.closest?.("a, button, [data-cursor]");
      el.dataset.state = t ? ((t as HTMLElement).dataset.cursor ?? "link") : "";
    };
    const leave = () => { delete el.dataset.on; };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      delete root.dataset.cursor;
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="cross" aria-hidden="true">
      <span className="cross__h" />
      <span className="cross__v" />
      <span className="cross__dot" />
      <span className="cross__ring" />
    </div>
  );
}
