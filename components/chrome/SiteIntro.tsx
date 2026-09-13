"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PixelMark } from "@/components/primitives/PixelMark";
import { DUR, EASE } from "@/lib/motion";
import { useSound } from "@/lib/sound";

const SESSION_KEY = "jvr.intro";

const RESOLVE_AT = 900;
const NAME_AT = 1.15;
const CHOICE_AT = 1600;

type Phase = "boot" | "building" | "choosing" | "leaving" | "done";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * SCENE 00 — INTRO (Nightkidz + RemyShoots)
 *
 * 100vw / 100dvh of ink. Blocks rasterized from the real mark assemble, the
 * mark resolves sharp, the name arrives, then the sound question — sitting
 * directly on the viewport with no panel, card or dialog chrome around it.
 *
 * Gating: seen this session → skipped outright; reduced motion → no build;
 * sound already chosen → shorter sequence that enters itself.
 */
export function SiteIntro() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [resolved, setResolved] = useState(false);
  const [reduced, setReduced] = useState(false);
  const { enabled, setEnabled, cue } = useSound();
  const decided = useRef(false);

  useIso(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* blocked storage — treat as a first visit */
    }
    if (seen) {
      setPhase("done");
      return;
    }
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(r);
    if (r) setResolved(true);
    setPhase("building");
  }, []);

  // The mark snaps from blocks to vector a beat after assembly completes.
  useEffect(() => {
    if (phase !== "building" || reduced) return;
    const t = window.setTimeout(() => setResolved(true), RESOLVE_AT);
    return () => window.clearTimeout(t);
  }, [phase, reduced]);

  const finish = useCallback(
    (withSound: boolean | null) => {
      if (decided.current) return;
      decided.current = true;

      if (withSound !== null) setEnabled(withSound);
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* non-fatal */
      }

      setPhase("leaving");
      if (withSound) window.setTimeout(() => cue("enter"), 120);
      window.setTimeout(() => setPhase("done"), DUR.drape * 1000);

      // Reset the sequential focus starting point, or the first Tab resumes
      // from the dismissed button and skips past the skip link.
      window.setTimeout(() => {
        const b = document.body;
        b.setAttribute("tabindex", "-1");
        b.focus({ preventScroll: true });
        b.removeAttribute("tabindex");
      }, DUR.drape * 1000);
    },
    [setEnabled, cue],
  );

  // Already chosen on a previous visit: run short and enter without asking.
  useEffect(() => {
    if (phase !== "building" || enabled === null) return;
    const t = window.setTimeout(() => finish(null), reduced ? 350 : 1500);
    return () => window.clearTimeout(t);
  }, [phase, enabled, reduced, finish]);

  useEffect(() => {
    if (phase !== "building" || enabled !== null) return;
    const t = window.setTimeout(() => setPhase("choosing"), reduced ? 0 : CHOICE_AT);
    return () => window.clearTimeout(t);
  }, [phase, enabled, reduced]);

  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          data-tone="ink"
          role="dialog"
          aria-modal="true"
          aria-label="Entry"
          className="intro"
          initial={false}
          animate={{ clipPath: phase === "leaving" ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)" }}
          transition={{ duration: DUR.drape, ease: EASE.signature }}
        >
          <div className="intro__mark">
            <PixelMark size={132} res={14} resolved={resolved} />
          </div>

          <motion.p
            className="intro__name u-clip"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DUR.base, delay: reduced ? 0 : NAME_AT }}
          >
            <motion.span
              style={{ display: "inline-block" }}
              initial={reduced ? false : { y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: DUR.slow, ease: EASE.mask, delay: reduced ? 0 : NAME_AT }}
            >
              Joris van Rijn
            </motion.span>
          </motion.p>

          <AnimatePresence>
            {phase === "choosing" && (
              <motion.div
                className="intro__sound"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.base, ease: EASE.signature }}
              >
                <p className="u-micro intro__ask">Sound?</p>
                <div className="intro__choices">
                  <button type="button" className="intro__choice" onClick={() => finish(true)} autoFocus>
                    With
                  </button>
                  <span className="intro__sep" aria-hidden="true" />
                  <button type="button" className="intro__choice" onClick={() => finish(false)}>
                    Without
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
