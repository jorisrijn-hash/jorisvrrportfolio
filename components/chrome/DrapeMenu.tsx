"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ROUTES } from "@/lib/routes";
import { DUR, EASE, STAGGER, useReducedMotion } from "@/lib/motion";
import { useSound } from "@/lib/sound";
import { SoundToggle } from "./SoundToggle";
import { SITE } from "@/content/site";

type Props = { open: boolean; onClose: () => void };

/**
 * DRAPE (Kexsio).
 *
 * The plane has weight: it falls from above with its far edge lagging the near
 * one (a skew that settles to zero), rather than fading in. Leaving, it lifts
 * from the bottom. Items are revealed by their own masks on a stagger, so the
 * list resolves after the surface has landed — not with it.
 *
 * Accessibility is not traded for the effect: focus moves in, is trapped, and
 * returns to the trigger; Escape closes; scroll is locked.
 */
export function DrapeMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const { cue } = useSound();

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      restoreTo.current?.focus();
    };
  }, [open, onClose]);

  const surface = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { y: "-100%", skewY: -3, opacity: 0.9 },
        animate: { y: "0%", skewY: 0, opacity: 1 },
        exit: { y: "-100%", skewY: -2, opacity: 0.9 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panel}
          id="site-menu"
          className="drape"
          data-tone="burgundy"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          style={{ transformOrigin: "top center" }}
          {...surface}
          transition={{ duration: DUR.drape, ease: EASE.signature }}
        >
          <nav aria-label="Primary">
            <ul className="drape__list">
              {ROUTES.map((route, i) => {
                const current =
                  route.href === "/" ? pathname === "/" : pathname.startsWith(route.href);

                return (
                  <li key={route.href} className="drape__item">
                    <span className="u-clip">
                      <motion.span
                        style={{ display: "block" }}
                        initial={reduced ? false : { y: "110%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "110%" }}
                        transition={{
                          duration: DUR.slow,
                          ease: EASE.mask,
                          delay: reduced ? 0 : 0.3 + i * STAGGER.base,
                        }}
                      >
                        <Link
                          href={route.href}
                          className="drape__link"
                          aria-current={current ? "page" : undefined}
                          onClick={onClose}
                          onPointerEnter={() => cue("hover")}
                        >
                          <span className="drape__index" aria-hidden="true">
                            {route.index}
                          </span>
                          <span>{route.label}</span>
                        </Link>
                      </motion.span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </nav>

          <motion.div
            className="drape__foot"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base, delay: reduced ? 0 : 0.7 }}
          >
            <div className="drape__meta u-micro">
              <span>{SITE.domain}</span>
              <span>{SITE.location}</span>
              <span className="status">
                <span className="status__dot" aria-hidden="true" />
                {SITE.availability}
              </span>
            </div>
            <SoundToggle />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
