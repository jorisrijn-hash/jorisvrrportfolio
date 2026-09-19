"use client";

import { useEffect, useRef } from "react";
import type { Testimonial } from "@/content/proof";
import { computeLayout } from "@/lib/layout";
import { registerProofScroller, returnHome, setProof, useProofSpec, useTestimonials } from "@/lib/proof";
import { clamp01, seg, smooth } from "@/lib/sculpture/math";
import { addTick } from "@/lib/ticker";
import { triggerVhs } from "@/lib/vhs";
import { useSound, type Cue } from "@/lib/sound";

/** Scroll distance of the whole morph, in viewport heights — about two
 *  deliberate trackpad gestures, long enough to watch each phase. */
const DISTANCE = { desktop: 2.2, compact: 1.9 };

/** The progress follows the scroll on a critically damped spring: no
 *  overshoot, no bounce, ~90ms to catch up — smoothing, not delayed control. */
const SPRING = 11;

/** Sound at the milestones, once per crossing going down. Re-armed only after
 *  falling a clear margin back below, so resting on a threshold stays quiet. */
const MARKS: { at: number; cue: Cue }[] = [
  { at: 0.14, cue: "release" },  // the object lets go — a quiet click
  { at: 0.4, cue: "sweep" },     // mid-morph — a soft tonal sweep
  { at: 0.62, cue: "align" },    // the lanes form
  { at: 0.74, cue: "row" },      // the first card resolves — a tiny tick
  { at: 0.96, cue: "land" },     // proof has settled
];
const REARM = 0.08;

/** Lane reveal windows by rank — the centre lane first, then left, then
 *  right. Nothing shows before the structure has formed. */
const REVEAL = [[0.68, 0.84], [0.72, 0.88], [0.76, 0.92]] as const;
const easeOut3 = (x: number) => 1 - (1 - x) ** 3;

/**
 * HOME -> SOCIAL PROOF. Not a page and not a section below Home: the Home
 * viewport stays where it is while scrolling reconfigures it.
 *
 *   · a transparent scroller over the stage provides real, native scroll
 *     (~1.6 viewports); its offset, lightly smoothed, is the ONE progress
 *     value (lib/proof) that everything else reads
 *   · HomeStage morphs the sculpture from it — the rails the cubes form are
 *     where these lanes stand (lib/layout proof spec)
 *   · the lanes sit in a fixed layer inside static clip windows; each is
 *     revealed by one transform, and drifts on a CSS keyframe loop that only
 *     runs once the proof has formed
 *   · sound, the VHS pass and the HUD react at threshold crossings only
 *
 * Nothing here renders per frame: the tick writes transforms and attributes.
 */
export function ProofSequence({ live, still }: { live: boolean; still: boolean }) {
  const items = useTestimonials();
  const { cue } = useSound();
  const scroller = useRef<HTMLDivElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const spec = useProofSpec();
  const liveRef = useRef(live);
  useEffect(() => { liveRef.current = live; }, [live]);

  // Lanes: entries dealt round-robin, so every lane mixes short and long.
  const cols = spec?.cols ?? 1;
  const lanes: Testimonial[][] = Array.from({ length: cols }, (_, c) => items.filter((_, i) => i % cols === c));
  const order = (spec?.lanes ?? [0])
    .map((x, i) => ({ i, x }))
    .sort((a, b) => Math.abs(a.x) - Math.abs(b.x) || a.x - b.x)
    .map((o) => o.i);

  useEffect(() => {
    const sc = scroller.current;
    const root = layer.current;
    const sp = spacer.current;
    if (!sc || !root || !sp) return;
    registerProofScroller(sc);

    const lanesEls = [...root.querySelectorAll<HTMLElement>("[data-reveal-lane]")];
    let laneH = 1;
    const size = () => {
      const L = computeLayout();
      sp.style.height = `${Math.round(L.vh * (1 + (L.compact ? DISTANCE.compact : DISTANCE.desktop)))}px`;
      laneH = Math.max(1, L.vh - L.proof.top - L.proof.bottom);
      // a steady drift: every track moves at the same px/s whatever its length
      root.querySelectorAll<HTMLElement>(".proof-lane__track").forEach((t) => {
        const half = t.scrollHeight / 2;
        // slow enough to read comfortably while it moves
        t.style.setProperty("--dur", `${Math.max(40, half / 9).toFixed(1)}s`);
      });
    };
    size();
    window.addEventListener("resize", size);

    let target = 0;
    const onScroll = () => {
      target = clamp01(sc.scrollTop / Math.max(1, sc.scrollHeight - sc.clientHeight));
    };
    sc.addEventListener("scroll", onScroll, { passive: true });

    // Keyboard: the page scrolls even while focus sits in the HUD; Escape
    // brings Home back.
    const onKey = (e: KeyboardEvent) => {
      if (!liveRef.current || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select")) return;
      if (e.key === "Escape") {
        void returnHome(still);
        return;
      }
      const page = sc.clientHeight * 0.8;
      let dy = 0;
      if (e.key === "ArrowDown") dy = 80;
      else if (e.key === "ArrowUp") dy = -80;
      else if (e.key === "PageDown") dy = page;
      else if (e.key === "PageUp") dy = -page;
      else if (e.key === " " && !t?.closest?.("button, a")) dy = e.shiftKey ? -page : page;
      else if (e.key === "End") dy = sc.scrollHeight;
      else if (e.key === "Home") dy = -sc.scrollTop;
      if (!dy) return;
      e.preventDefault();
      sc.scrollBy({ top: dy, behavior: still ? "auto" : "smooth" });
    };
    window.addEventListener("keydown", onKey);

    // A wheel that starts on a HUD control (nav, dock, sound) would scroll
    // nothing — those sit outside the scroller. Hand it over.
    const onWheel = (e: WheelEvent) => {
      if (!liveRef.current || e.ctrlKey) return;
      const t = e.target as Node | null;
      if (t && sc.contains(t)) return;
      if (!(t as HTMLElement | null)?.closest?.(".home-hud, .proof")) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? sc.clientHeight : 1;
      sc.scrollBy({ top: e.deltaY * unit, behavior: "instant" });
    };
    window.addEventListener("wheel", onWheel, { passive: true });

    let p = 0;
    let v = 0;
    let lastP = -1;
    const written: string[] = [];
    const armed = MARKS.map(() => true);
    let vhsSide = 0;   // which side of the VHS window the morph was last on
    let formed = false;
    let sculpture: HTMLElement | null = null;
    const stage = root.closest<HTMLElement>(".experience");

    const stop = addTick((_now, dt) => {
      if (!liveRef.current) {
        if (p !== 0) {
          p = target = 0;
          setProof(0);
        }
        return;
      }
      // raw scroll -> smoothed progress -> everything else
      if (still) {
        p = target;
      } else {
        const h = Math.min(dt, 34) / 1000;
        v += (SPRING * SPRING * (target - p) - 2 * SPRING * v) * h;
        p = clamp01(p + v * h);
        if (Math.abs(target - p) < 0.0003 && Math.abs(v) < 0.002) {
          p = target;
          v = 0;
        }
      }
      if (p === lastP) return;
      const down = p > lastP;
      lastP = p;
      setProof(p);

      // Lanes: tracking up into their clip window, opacity only as support.
      lanesEls.forEach((el) => {
        const rank = +(el.dataset.rank ?? 0);
        const [a, b] = REVEAL[Math.min(rank, REVEAL.length - 1)];
        const e = still ? smooth(seg(p, a, b)) : easeOut3(seg(p, a, b));
        const v = `translate3d(0, ${((1 - e) * laneH * 0.9).toFixed(1)}px, 0)|${Math.min(1, e * 1.6).toFixed(3)}`;
        const k = +(el.dataset.i ?? 0);
        if (written[k] === v) return;
        written[k] = v;
        const [tf, op] = v.split("|");
        el.style.transform = still ? "none" : tf;
        el.style.opacity = op;
      });

      // The drift runs, and cards answer the pointer, once the proof has
      // settled; the environment steps back behind them.
      const f = formed ? p > 0.84 : p > 0.9;
      if (f !== formed) {
        formed = f;
        root.toggleAttribute("data-live", f);
        stage?.toggleAttribute("data-proof-formed", f);
      }

      // Reduced motion: the sculpture is drawn once, so it crossfades instead
      // of morphing.
      if (still) {
        sculpture ??= document.querySelector<HTMLElement>(".sculpture");
        if (sculpture) sculpture.style.opacity = String(1 - smooth(seg(p, 0.1, 0.5)));
      }

      if (!still) {
        // Sound: each milestone once per crossing going down; re-armed below.
        MARKS.forEach((m, i) => {
          if (down && armed[i] && p >= m.at) {
            armed[i] = false;
            cue(m.cue);
          } else if (!armed[i] && p < m.at - REARM) {
            armed[i] = true;
          }
        });
        // One short VHS pass through the strongest part of the morph, in
        // either direction; re-armed once clear of the window.
        // (0.52-0.60 only: the rest of the morph stays clean, which is
        // what makes the interference read)
        const side = p < 0.52 ? -1 : p > 0.6 ? 1 : 0;
        if (side !== 0 && vhsSide !== 0 && side !== vhsSide) triggerVhs({ strength: 0.5 });
        if (side !== 0) vhsSide = side;
      }
    });

    return () => {
      stop();
      window.removeEventListener("resize", size);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      sc.removeEventListener("scroll", onScroll);
      registerProofScroller(null);
      setProof(0);
      stage?.removeAttribute("data-proof-formed");
      if (sculpture) sculpture.style.opacity = "";
    };
  }, [cue, still, cols]);

  if (!spec) return null;

  /** `echo`: a repeat that exists only so the drift loops — hidden from
   *  assistive tech, which reads each entry once. */
  const card = (t: Testimonial, key: string, echo = false) => (
    <article
      key={key}
      className="proof-card"
      data-cursor="view"
      data-placeholder={t.isPlaceholder || undefined}
      aria-hidden={echo || undefined}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") cue("hover");
      }}
    >
      <i className="proof-card__node" data-c="tl" aria-hidden="true" />
      <i className="proof-card__node" data-c="tr" aria-hidden="true" />
      <i className="proof-card__node" data-c="bl" aria-hidden="true" />
      <i className="proof-card__node" data-c="br" aria-hidden="true" />
      <p className="proof-card__id">
        {`// Signal_${t.id} · ${t.year}`}
        {t.isPlaceholder ? <span className="proof-card__ph">Placeholder</span> : null}
      </p>
      <blockquote className="proof-card__quote">
        <p>
          <span className="proof-card__mark" aria-hidden="true">“</span>
          {`${t.quote}”`}
        </p>
      </blockquote>
      <footer className="proof-card__by">
        <p className="proof-card__name">{t.name}</p>
        <p className="proof-card__role">{`${t.role} / ${t.company}`}</p>
      </footer>
    </article>
  );

  return (
    <>
      <div ref={scroller} className="proof-scroll" data-live={live || undefined} aria-hidden="true">
        <div ref={spacer} className="proof-scroll__spacer" />
      </div>

      <section
        ref={layer}
        className="proof"
        aria-labelledby="proof-title"
        style={{ ["--lane-top" as string]: `${spec.top}px`, ["--lane-bottom" as string]: `${spec.bottom}px` }}
      >
        <h2 id="proof-title" className="proof__sr">Testimonials</h2>
        {lanes.map((list, i) => (
          <div
            key={i}
            className="proof-lane"
            data-dir={i % 2 ? "down" : "up"}
            data-outer={(cols === 3 && i !== 1) || undefined}
            style={{ ["--x" as string]: `${spec.lanes[i]}px`, ["--lane-w" as string]: `${spec.laneW}px` }}
          >
            <div className="proof-lane__reveal" data-reveal-lane data-i={i} data-rank={order.indexOf(i)}>
              <div className="proof-lane__track">
                {/* Two identical halves, so the drift loops seamlessly; each
                    half repeats its entries to be taller than the lane. */}
                <div className="proof-lane__copy">
                  {list.map((t) => card(t, `a-${t.id}`))}
                  {list.map((t) => card(t, `b-${t.id}`, true))}
                </div>
                <div className="proof-lane__copy" aria-hidden="true">
                  {list.map((t) => card(t, `c-${t.id}`))}
                  {list.map((t) => card(t, `d-${t.id}`))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
