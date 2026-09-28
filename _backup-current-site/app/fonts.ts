import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

/**
 * 1955 — Alan Smithee Studio. The identity face.
 *
 * Two cuts, the two the design uses: Light 300 (leads, display copy) and
 * Medium 500 (navigation, titles, small UI — and what a plain 400 resolves
 * to). The cut has no 400/700, so never set those on --font-display: they
 * would be synthesised (globals.css turns synthesis off).
 *
 * preload:false: faces download lazily as they are first used, and the
 * intro covers that round-trip. adjustFontFallback keeps CLS ~0.
 */
export const display = localFont({
  variable: "--font-1955",
  display: "swap",
  preload: false,
  src: [
    { path: "./fonts/1955-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/1955-Medium.woff2", weight: "500", style: "normal" },
  ],
});

/** Geist Mono — metadata, numbering, status, system labels (§4). */
export const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500"],
});
