"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AssemblingMark } from "@/components/primitives/AssemblingMark";
import { LogoMark } from "@/components/primitives/LogoMark";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { useSound } from "@/lib/sound";

const SESSION_KEY = "jvr.intro";

/** Stagger tuned so the mark completes ≈1.2s in — §11 wants entry by ~1.5–3s. */
const CELL_STAGGER = 0.028;
const NAME_AT = 1.05;
const CHOICE_AT = 1.45;

type Phase = "boot" | "building" | "choosing" | "leaving" | "done";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * SITE INTRO (§11)
 *
 * BLACK → cells assemble the mark → name → sound decision → enter.
 *
 * Gating, in order of precedence:
 *   1. Already seen this session  → skipped entirely (no repeat tax)
 *   2. prefers-reduced-motion     → no build; mark and choice appear at rest
 *   3. Sound already decided      → shorter sequence, auto-enters
 *
 * The overlay is server-rendered so there is never a flash of the page behind
 * it, and the skip decision is taken in a layout effect — before paint.
 */
export function SiteIntro() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [reduced, setReduced] = useState(false);
  const { enabled, setEnabled, cue } = useSound();
  const decided = useRef(false);

  useIsoLayoutEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* blocked storage — treat as first visit */
    }

    if (seen) {
      setPhase("done");
      return;
    }

    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setPhase("building");
  }, []);

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
      // The arrival cue plays as the drape lifts, not before the gesture.
      if (withSound) window.setTimeout(() => cue("enter"), 120);
      window.setTimeout(() => setPhase("done"), DUR.drape * 1000);

      // Reset the sequential focus navigation starting point. The dismissed
      // button sat after the skip link in the DOM, so without this the first
      // Tab resumes from there and skips straight past it into the header.
      window.setTimeout(() => {
        const body = document.body;
        body.setAttribute("tabindex", "-1");
        body.focus({ preventScroll: true });
        body.removeAttribute("tabindex");
      }, DUR.drape * 1000);
    },
    [setEnabled, cue],
  );

  // Sound already chosen in a previous visit: show a short reduced sequence
  // and enter on its own rather than asking again.
  useEffect(() => {
    if (phase !== "building" || enabled === null) return;
    const t = window.setTimeout(() => finish(null), reduced ? 400 : 1500);
    return () => window.clearTimeout(t);
  }, [phase, enabled, reduced, finish]);

  // Undecided: reveal the choice once the mark and name have resolved.
  useEffect(() => {
    if (phase !== "building" || enabled !== null) return;
    const t = window.setTimeout(
      () => setPhase("choosing"),
      reduced ? 0 : CHOICE_AT * 1000,
    );
    return () => window.clearTimeout(t);
  }, [phase, enabled, reduced]);

  // Lock scroll while the overlay is up.
  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  const showChoice = phase === "choosing";
  const leaving = phase === "leaving";

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          data-tone="ink"
          role="dialog"
          aria-modal="true"
          aria-label="Site introduction"
          className="jvr-intro"
          initial={false}
          exit={{ opacity: 0 }}
          animate={
            leaving
              ? { clipPath: "inset(0 0 100% 0)" }
              : { clipPath: "inset(0 0 0% 0)" }
          }
          transition={{ duration: DUR.drape, ease: EASE.signature }}
        >
          <div className="jvr-intro__stack">
            {reduced ? (
              <LogoMark size={96} gap={0.14} />
            ) : (
              <AssemblingMark size={96} stagger={CELL_STAGGER} />
            )}

            <motion.p
              className="u-clip jvr-intro__name"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: DUR.base, delay: reduced ? 0 : NAME_AT }}
            >
              <motion.span
                style={{ display: "inline-block" }}
                initial={reduced ? false : { y: "110%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: DUR.slow,
                  ease: EASE.mask,
                  delay: reduced ? 0 : NAME_AT,
                }}
              >
                Joris van Rijn
              </motion.span>
            </motion.p>

            <AnimatePresence>
              {showChoice && (
                <motion.div
                  className="jvr-intro__choice"
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DUR.base, ease: EASE.signature }}
                >
                  <p className="u-micro jvr-intro__prompt">This site uses sound</p>
                  <div className="jvr-intro__actions">
                    <button
                      type="button"
                      className="jvr-intro__btn jvr-intro__btn--primary"
                      onClick={() => finish(true)}
                      autoFocus
                    >
                      Enter with sound
                    </button>
                    <button
                      type="button"
                      className="jvr-intro__btn"
                      onClick={() => finish(false)}
                    >
                      Enter silently
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
