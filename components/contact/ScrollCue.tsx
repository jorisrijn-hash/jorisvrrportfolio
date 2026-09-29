"use client";

import { useEffect, useState } from "react";
import { REACH } from "@/content/contact";

/**
 * SCROLL DOWN.
 *
 * The one nudge on the page. The form is the point of /contact and it is two
 * compositions below the introduction, so something has to say there is more
 * underneath — and say it loudly enough to actually be read, which the first
 * attempt at this, faint and in a bottom corner, was not.
 *
 * It is a rail on the right edge, held at the middle of the screen where the
 * eye already is: the words set vertically, and a tick running down a
 * hairline under them. It sits outside the page's gutter, so it is in the
 * margin rather than over anything, and it never takes a pointer event, so
 * it cannot block anything and the crosshair passes straight over it.
 *
 * It is hidden from assistive technology on purpose: the form is an ordinary
 * part of the document below this one, and a screen reader is already being
 * told that. This exists for an eye that has stopped at the first screen.
 */
export function ScrollCue() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const form = document.getElementById("write");
    if (!form) return;
    const io = new IntersectionObserver(
      ([e]) => setDone(e.isIntersecting),
      // it holds until the form is properly arriving, not merely near
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    io.observe(form);
    return () => io.disconnect();
  }, []);

  return (
    <div className="cue" data-done={done || undefined} aria-hidden="true">
      <span className="cue__t m">{REACH.cue}</span>
      <span className="cue__rail">
        <span className="cue__tick" />
      </span>
    </div>
  );
}
