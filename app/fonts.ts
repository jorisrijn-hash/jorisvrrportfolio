import localFont from "next/font/local";
import { Archivo, Geist_Mono } from "next/font/google";

/**
 * ARCHIVO — the voice of the site.
 *
 * One variable family doing two jobs, because it carries a width axis: set
 * narrow and heavy it is the enormous display type the page is built on, and
 * at normal width and a light weight it is the body copy underneath it. A
 * width axis is what makes type this large readable — a wide grotesque at
 * 190px fits two words on a screen and reads as loud rather than as
 * editorial.
 */
export const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  axes: ["wdth"],
});

/**
 * 1955 — Alan Smithee Studio. Kept for one thing only: the wordmark. It is
 * the identity face from the previous site, and a name is the right place for
 * a face with character. Nothing else loads it.
 */
export const display = localFont({
  variable: "--font-1955",
  display: "swap",
  preload: false,
  src: [{ path: "./fonts/1955-Medium.woff2", weight: "500", style: "normal" }],
});

/** Geist Mono — metadata, numbering, status, anything the system says. */
export const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500"],
});
