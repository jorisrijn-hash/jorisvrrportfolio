"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/primitives/LogoMark";
import { useSound } from "@/lib/sound";
import { DrapeMenu } from "./DrapeMenu";

const SCENES = ["Index", "Positioning", "Statement", "Currently", "Work", "Lab", "Profile", "Contact"];

/**
 * Navigation barely exists at rest: the mark, a scene readout, and MENU.
 * No header container, no bar, no background — it sits on the page and uses
 * mix-blend-mode: difference so it inverts against whatever scrolls under it.
 */
export function Nav({ showProgress = false }: { showProgress?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState(0);
  const { cue } = useSound();

  // Which scene is under the chrome — mono readout only, no scroll hijack.
  useEffect(() => {
    if (!showProgress) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const i = sections.indexOf(visible.target as HTMLElement);
          if (i >= 0) setScene(i);
        }
      },
      { threshold: [0.25, 0.5, 0.75] },
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [showProgress]);

  return (
    <>
      <header className="nav" data-menu-open={open}>
        <Link
          href="/"
          aria-label="Joris van Rijn — home"
          onPointerEnter={() => cue("hover")}
          style={{ display: "inline-flex" }}
        >
          <LogoMark size={20} split={0} />
        </Link>

        {showProgress ? (
          <p className="nav__progress" aria-hidden="true">
            {String(scene + 1).padStart(2, "0")} / {SCENES[scene] ?? ""}
          </p>
        ) : null}

        <button
          type="button"
          className="nav__menu"
          aria-expanded={open}
          aria-controls="site-menu"
          onPointerEnter={() => cue("hover")}
          onPointerDown={() => cue("press")}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{open ? "Close" : "Menu"}</span>
          <span className="nav__glyph" aria-hidden="true">+</span>
        </button>
      </header>

      <DrapeMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
