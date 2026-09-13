"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { Scene } from "@/components/primitives/Scene";
import { Meta } from "@/components/primitives/Meta";
import { LogoMark } from "@/components/primitives/LogoMark";
import { DUR, EASE, useReducedMotion } from "@/lib/motion";
import { SITE } from "@/content/site";

/**
 * SCENE 01 — HERO
 *
 * The name owns the viewport: two lines of --text-scene spanning gutter to
 * gutter, second line indented so the block is asymmetric rather than a
 * centred stack. The mark is a compositional object — huge, burgundy, cropped
 * by the right edge, drifting on scroll.
 *
 * ASSEMBLE: the two lines arrive through masks, split-second apart, and the
 * mark's own cut closes (split 1 -> 0) as it settles.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const drift = useSpring(useTransform(scrollYProgress, [0, 1], [0, 160]), {
    stiffness: 60,
    damping: 20,
  });
  const spin = useTransform(scrollYProgress, [0, 1], [0, 12]);

  const line = (text: string, delay: number, className: string) => (
    <span className="u-clip hero__line">
      <motion.span
        style={{ display: "block" }}
        className={className}
        initial={reduced ? false : { y: "108%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.05, ease: EASE.mask, delay }}
      >
        {text}
      </motion.span>
    </span>
  );

  return (
    <Scene tone="ink" as="section" full measure="none" className="hero" style={{ position: "relative" }}>
      <div ref={ref as never} style={{ display: "contents" }} />

      {/* Outer box owns POSITION (CSS); inner owns DRIFT (Motion). Motion
          writes `transform`, so a CSS translate on the same element is lost. */}
      <div className="hero__mark" aria-hidden="true">
        <motion.div
          style={reduced ? { width: "100%", height: "100%" } : { width: "100%", height: "100%", y: drift, rotate: spin }}
          initial={reduced ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DUR.slow, ease: EASE.signature, delay: 0.1 }}
        >
          <LogoMark size="100%" split={0} />
        </motion.div>
      </div>

      <div className="hero__top">
        <Meta>NL — 2026</Meta>
        <Meta>{SITE.domain}</Meta>
      </div>

      <h1 className="hero__name">
        {line("Joris", 0.25, "")}
        {line("van Rijn", 0.36, "hero__line--2")}
      </h1>

      <div className="hero__foot">
        <motion.p
          className="hero__disciplines"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DUR.slow, delay: 0.9 }}
        >
          {SITE.disciplines.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </motion.p>
        <Meta className="status" style={{ color: "var(--on-surface-dim)" }}>
          <span className="status__dot" aria-hidden="true" />
          {SITE.availability}
        </Meta>
      </div>
    </Scene>
  );
}
