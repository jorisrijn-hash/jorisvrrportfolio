"use client";

import { useEffect, useRef } from "react";
import { IDENTITY } from "@/content/portfolio";

/**
 * The portrait, which is the pointer while the pointer is in the hero.
 *
 * At rest it sits in the middle of the words, small on purpose: the
 * typography is the hero and this is the interruption inside it. Bring a
 * pointer down onto the words and the portrait comes to meet it and then
 * carries it, riding over the lines with weight behind it rather than
 * snapping to the cursor. Take the pointer off them and it finds its way
 * back to the middle.
 *
 * THE HANDOVER HAPPENS JUST ABOVE THE TEXT, not at the edge of the section.
 * The hero runs up behind the navigation, and the navigation is a fixed
 * element on top of it, so asking the section itself would mean the pointer
 * left the hero every time it reached for a link — the face would leave and
 * come back, and break up again, on every pass. The boundary is therefore
 * geometry, read against the top of the lines: the pointer has to come
 * properly onto the text to be taken, and is handed back at the text's own
 * top edge. So the face never rises into the band the navigation sits in,
 * and resting on the boundary is not a switch. Above the words the crosshair
 * has the pointer; on them, the portrait does.
 *
 * There is one pointer on screen, and on the words it is a face.
 *
 * The swap itself is a cut, both ways. A cursor is either the pointer or it
 * is not, and anything in between is a window in which a crosshair sits
 * inside a photograph. The face leaves in the instant the crosshair returns,
 * comes back to the middle while it cannot be seen, and fades up there.
 *
 * The signal breaks up as it arrives, two colour channels pulling apart in a
 * couple of thin bands, and then again now and then while it is carrying,
 * small enough to be noticed rather than watched. At rest it is completely
 * clean, and with reduced motion or without a real pointer it never moves at
 * all: it simply stays in the middle, and the crosshair keeps its job.
 */
export function HeroPortrait() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine) and (hover: hover)").matches) return;
    const hero = el.closest<HTMLElement>(".hero");
    const lines = hero?.querySelector<HTMLElement>(".hero__lines");
    if (!hero || !lines) return;

    const root = document.documentElement;
    /* The commitment the words ask for. Taking the pointer needs it to be
       properly on the text; giving it back happens at the text's own top
       edge. The hysteresis runs this way round on purpose: it means the face
       never rises into the band the navigation occupies, and a hand resting
       exactly on the boundary is still not a switch. */
    const BAND = 14;
    let frame = 0;
    let running = false;    // inside step(), which schedules its own next frame
    let home = 0;           // the timer that puts it back while it is invisible
    let lead = false;
    let released = 0;       // when the crosshair last took over
    /* where the pointer is, in the page's own coordinates, so that scrolling
       under a still pointer does not drag the portrait along with the hero */
    let px = 0;
    let py = 0;
    let inside = false;
    let x = 0;      // where the portrait is, relative to the hero's centre
    let y = 0;

    const step = () => {
      frame = 0;
      running = true;
      const r = hero.getBoundingClientRect();
      const tx = px - (r.left + r.width / 2);
      const ty = py - (r.top + r.height / 2);
      x += (tx - x) * 0.13;
      y += (ty - y) * 0.13;
      el.style.setProperty("--px", `${x.toFixed(1)}px`);
      el.style.setProperty("--py", `${y.toFixed(1)}px`);
      decide();
      running = false;
      // It keeps running even when the pointer is still, because the hero can
      // scroll out from under it.
      if (lead) frame = requestAnimationFrame(step);
    };
    const run = () => { if (!frame && !running) frame = requestAnimationFrame(step); };

    // one burst on arrival, then the quieter loop takes over (CSS)
    const burst = () => {
      el.dataset.burst = "";
      window.setTimeout(() => el?.removeAttribute("data-burst"), 620);
    };

    /**
     * Who has the pointer, decided by where it is rather than by what is
     * under it. `lead` is its own hysteresis: crossing DOWN past the top of
     * the lines takes it, and it is not given back until the pointer is a
     * whole band clear above them again.
     */
    const decide = () => {
      if (!inside) return void (lead && release());
      const t = lines.getBoundingClientRect().top;
      const want = lead ? py > t : py > t + BAND;
      if (want === lead) return;
      if (want) take();
      else release();
    };
    const take = () => {
      lead = true;
      window.clearTimeout(home);
      el.removeAttribute("data-away");
      el.removeAttribute("data-home");
      el.dataset.live = "";
      el.dataset.lead = "";
      root.dataset.heroCursor = "on";
      // Reaching for the navigation and coming back is one pass, not two
      // arrivals: the signal does not break up again on the way back in.
      if (performance.now() - released > 1400) burst();
      run();
    };
    /**
     * Handing back. The crosshair is already on screen by the time this line
     * runs — removing the attribute is not a transition any more — so the
     * face must get out of the way rather than drift home underneath it.
     * It goes out where it stands, returns to the middle unseen, and is
     * simply there again.
     */
    const release = () => {
      lead = false;
      released = performance.now();
      delete el.dataset.lead;
      delete root.dataset.heroCursor;
      el.dataset.away = "";
      window.clearTimeout(home);
      // long enough for the frame that hides it to have been painted, short
      // enough that it is never seen anywhere but where it belongs
      home = window.setTimeout(() => {
        x = 0;
        y = 0;
        el.style.setProperty("--px", "0px");
        el.style.setProperty("--py", "0px");
        delete el.dataset.live;
        delete el.dataset.away;
        el.dataset.home = "";
        window.setTimeout(() => el?.removeAttribute("data-home"), 520);
      }, 40);
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      const r = hero.getBoundingClientRect();
      inside = py >= r.top && py <= r.bottom;
      decide();
    };
    const gone = () => { inside = false; decide(); };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", gone);
    window.addEventListener("blur", gone);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", gone);
      window.removeEventListener("blur", gone);
      delete root.dataset.heroCursor;
      window.clearTimeout(home);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="hero__portrait">
      <img
        src="/portrait-820.webp"
        srcSet="/portrait-480.webp 480w, /portrait-820.webp 820w"
        sizes="(max-width: 900px) 26vw, 11vw"
        width={820}
        height={1025}
        alt={`${IDENTITY.name}, portrait`}
        fetchPriority="high"
        decoding="async"
      />
      {/* the two channels that pull apart. They are the same photograph,
          reduced to one colour each and screened back together, so at rest
          they add up to exactly the image underneath. */}
      <span className="hero__ch" data-ch="r" aria-hidden="true" />
      <span className="hero__ch" data-ch="c" aria-hidden="true" />
    </div>
  );
}
