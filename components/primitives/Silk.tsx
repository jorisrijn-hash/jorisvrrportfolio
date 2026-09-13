"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion";

/**
 * SILK (Kexsio) — the closing environment, and the only material moment on
 * the site.
 *
 * A 2D canvas line-field, not WebGL: a few dozen horizontal threads warped by
 * layered sine waves and pulled toward the pointer, so the surface behaves
 * like hanging cloth being disturbed. Reaching it should feel like stepping
 * into a different environment.
 *
 * Performance (§25): one rAF, sized to devicePixelRatio capped at 2, paused
 * entirely when the scene is off-screen via IntersectionObserver, and
 * cancelled under reduced motion. Strokes only — no per-frame allocation.
 */
export function Silk({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = canvas.current;
    if (!el || reduced) return;

    const ctx = el.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let t = 0;

    // Pointer influence, eased so the cloth lags the cursor.
    const pointer = { x: 0.5, y: 0.5, ex: 0.5, ey: 0.5, active: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = el.getBoundingClientRect();
      w = r.width;
      h = r.height;
      el.width = Math.max(1, Math.floor(w * dpr));
      el.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      t += 0.0055;
      pointer.ex += (pointer.x - pointer.ex) * 0.06;
      pointer.ey += (pointer.y - pointer.ey) * 0.06;

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;

      const threads = Math.max(18, Math.min(46, Math.round(h / 22)));
      const step = Math.max(6, Math.round(w / 90));

      for (let i = 0; i < threads; i++) {
        const v = i / (threads - 1);
        const baseY = v * h;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(241, 237, 228, ${0.07 + 0.24 * Math.sin(Math.PI * v)})`;

        for (let x = 0; x <= w; x += step) {
          const u = x / w;

          // Layered waves give the weave; amplitude swells mid-cloth.
          const drape = Math.sin(Math.PI * v) * 26;
          let y =
            baseY +
            Math.sin(u * 5.2 + t * 1.7 + v * 3.1) * drape * 0.5 +
            Math.sin(u * 11.3 - t * 1.1 + v * 6.2) * drape * 0.18;

          // The pointer pulls the nearest threads toward it.
          const dx = u - pointer.ex;
          const dy = v - pointer.ey;
          const pull = Math.exp(-(dx * dx * 9 + dy * dy * 26)) * pointer.active;
          y += pull * 70 * (pointer.ey > v ? -1 : 1);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width;
      pointer.y = (e.clientY - r.top) / r.height;
      pointer.active = 1;
    };
    const onLeave = () => {
      pointer.active = 0;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Only animate while the scene is actually on screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(el);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  if (reduced) return null;

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
