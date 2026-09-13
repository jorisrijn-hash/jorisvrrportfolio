import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

/**
 * 1955 — Alan Smithee Studio. The identity face.
 *
 * IMPORTANT: this cut ships FOUR weights only — Thin 100, Light 300,
 * Medium 500, Black 900. There is no Regular (400) and no Bold (700), so the
 * type roles below are built around what actually exists:
 *
 *   100 Thin    large editorial display, hero statements
 *   300 Light   leads, long-form display copy
 *   500 Medium  navigation, section titles, small UI  <- the workhorse
 *   900 Black   rare impact, and the target of WEIGHT motion
 *
 * Never set font-weight 400/600/700 on --font-display: the browser would
 * synthesise it. Use the tokens in lib/type.ts instead.
 *
 * preload:false is deliberate. Eight faces is ~350KB; preloading all of it to
 * use two is wasteful. Faces download lazily as they are used, and the intro
 * sequence (SiteIntro) covers that first round-trip — by the time the hero
 * reveals, the display face has landed. adjustFontFallback keeps CLS ~0.
 */
export const display = localFont({
  variable: "--font-1955",
  display: "swap",
  preload: false,
  src: [
    { path: "./fonts/1955-Thin.woff2", weight: "100", style: "normal" },
    { path: "./fonts/1955-ThinItalic.woff2", weight: "100", style: "italic" },
    { path: "./fonts/1955-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/1955-LightItalic.woff2", weight: "300", style: "italic" },
    { path: "./fonts/1955-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/1955-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/1955-Black.woff2", weight: "900", style: "normal" },
    { path: "./fonts/1955-BlackItalic.woff2", weight: "900", style: "italic" },
  ],
});

/** Geist Mono — metadata, numbering, status, system labels (§4). */
export const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500"],
});
