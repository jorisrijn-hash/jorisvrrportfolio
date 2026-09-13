"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/primitives/LogoMark";
import { useSound } from "@/lib/sound";
import { DrapeMenu } from "./DrapeMenu";

/**
 * Resting navigation is two elements: the mark and MENU (§15).
 *
 * The header uses mix-blend-mode: difference so it inverts against whatever
 * section scrolls under it — one INVERT behaviour instead of per-section
 * colour logic.
 */
export function ChromeHeader() {
  const [open, setOpen] = useState(false);
  const { cue } = useSound();

  return (
    <>
      <header className="jvr-header" data-menu-open={open}>
        <Link
          href="/"
          className="jvr-header__home"
          aria-label="Joris van Rijn — home"
          onPointerEnter={() => cue("hover")}
        >
          <LogoMark size={22} gap={0.14} />
        </Link>

        <div className="jvr-header__actions">
          <button
            type="button"
            className="jvr-nav-btn"
            aria-expanded={open}
            aria-controls="site-menu"
            onPointerEnter={() => cue("hover")}
            onPointerDown={() => cue("press")}
            onClick={() => setOpen((v) => !v)}
          >
            <span>{open ? "Close" : "Menu"}</span>
            <span className="jvr-nav-btn__glyph" aria-hidden="true">
              +
            </span>
          </button>
        </div>
      </header>

      <DrapeMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
