"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ROUTES } from "@/lib/routes";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { useSound } from "@/lib/sound";
import { SoundToggle } from "./SoundToggle";

type Props = { open: boolean; onClose: () => void };

/**
 * DRAPE (§9, §15). A full-screen burgundy environment that falls into place
 * and lifts away, rather than a panel that slides.
 *
 * Accessibility is not traded away for the effect: focus moves in on open,
 * is trapped while open, returns to the trigger on close, Escape closes, and
 * the rest of the page is inert to screen readers via aria-hidden on open.
 */
export function DrapeMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
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
      if (items.length === 0) return;
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panel}
          id="site-menu"
          className="jvr-menu"
          data-tone="burgundy"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(100% 0 0 0)" }}
          transition={{ duration: DUR.drape, ease: EASE.signature }}
        >
          <nav aria-label="Primary">
            <ul className="jvr-menu__list">
              {ROUTES.map((route, i) => {
                const current =
                  route.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(route.href);

                return (
                  <li key={route.href} className="jvr-menu__item">
                    <motion.div
                      className="u-clip"
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "110%" }}
                      transition={{
                        duration: DUR.slow,
                        ease: EASE.mask,
                        delay: 0.18 + i * STAGGER.base,
                      }}
                    >
                      <Link
                        href={route.href}
                        className="jvr-menu__link"
                        aria-current={current ? "page" : undefined}
                        onClick={onClose}
                        onPointerEnter={() => cue("hover")}
                      >
                        <span className="jvr-menu__index" aria-hidden="true">
                          {route.index}
                        </span>
                        <span>{route.label}</span>
                      </Link>
                    </motion.div>
                  </li>
                );
              })}
            </ul>
          </nav>

          <motion.div
            className="jvr-menu__foot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base, delay: 0.55 }}
          >
            <div className="jvr-menu__meta u-micro">
              <span>jorisvrr.com</span>
              <span>The Netherlands</span>
              <span className="jvr-status">
                <span className="jvr-status__dot" aria-hidden="true" />
                Available for select opportunities
              </span>
            </div>
            <SoundToggle />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
