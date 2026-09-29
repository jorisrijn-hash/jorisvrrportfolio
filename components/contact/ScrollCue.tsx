"use client";

import { useEffect, useRef, useState } from "react";
import { REACH } from "@/content/contact";

/**
 * SCROLL DOWN.
 *
 * The one nudge on the page. The form is the point of /contact and it is two
 * compositions below the introduction, so something has to say that there is
 * more underneath. It is a line of the same small mono the rest of the site
 * labels things with, in the corner the composition leaves empty, and it goes
 * as soon as the form it is pointing at is on screen.
 *
 * It never takes a pointer event, so it cannot block anything and the
 * crosshair passes straight over it.
 *
 * It is hidden from assistive technology on purpose: the form is an ordinary
 * part of the document below this one, and a screen reader is already being
 * told that. This exists for an eye that has stopped at the first screen.
 */
export function ScrollCue() {
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const form = document.getElementById("write");
    if (!form) return;
    const io = new IntersectionObserver(
      ([e]) => setDone(e.isIntersecting),
      // a little before it arrives, so the cue is gone by the time there is
      // something to read rather than fading out over it
      { rootMargin: "0px 0px -25% 0px", threshold: 0 },
    );
    io.observe(form);
    return () => io.disconnect();
  }, []);

  return (
    <p ref={ref} className="cue m" data-done={done || undefined} aria-hidden="true">
      {REACH.cue}
      <span className="cue__a">↓</span>
    </p>
  );
}
