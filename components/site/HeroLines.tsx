"use client";

import { useEffect, useRef } from "react";
import { HERO_LINES } from "@/content/portfolio";

/**
 * The lines that are the hero.
 *
 * They run as CSS animations, which means the compositor carries them and the
 * main thread does nothing. Hovering one puts resistance under it: the
 * animation's own playback rate is eased down to a quarter and back up again,
 * which changes the speed without moving the line, because the Web Animations
 * API keeps its position when the rate changes. The others carry on.
 */
export function HeroLines() {
  const root = useRef<HTMLDivElement>(null);
  const rates = useRef(new Map<Element, { now: number; to: number }>());
  const frame = useRef(0);

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); }, []);

  const step = () => {
    frame.current = 0;
    let moving = false;
    rates.current.forEach((r, el) => {
      r.now += (r.to - r.now) * 0.12;
      if (Math.abs(r.to - r.now) > 0.004) moving = true;
      else r.now = r.to;
      el.getAnimations().forEach((a) => a.updatePlaybackRate(r.now));
    });
    if (moving) frame.current = requestAnimationFrame(step);
  };

  const resist = (e: React.PointerEvent<HTMLElement>, to: number) => {
    if (e.pointerType !== "mouse") return;
    const track = e.currentTarget.querySelector(".mq__track");
    if (!track) return;
    const r = rates.current.get(track) ?? { now: 1, to: 1 };
    r.to = to;
    rates.current.set(track, r);
    if (!frame.current) frame.current = requestAnimationFrame(step);
  };

  return (
    <div className="hero__lines" ref={root} aria-hidden="true">
      {HERO_LINES.map((line, i) => (
        <div
          key={line.text}
          className="mq"
          data-dir={line.dir}
          data-depth={i % 2}
          style={{ ["--dur" as string]: `${38 + i * 9}s`, ["--i" as string]: i }}
          onPointerEnter={(e) => resist(e, 0.24)}
          onPointerLeave={(e) => resist(e, 1)}
        >
          <div className="mq__track">
            <span>{`${line.text} · `.repeat(5)}</span>
            <span>{`${line.text} · `.repeat(5)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
