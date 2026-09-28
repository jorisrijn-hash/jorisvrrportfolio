/**
 * PROJECT MEDIA — what the site actually serves.
 *
 * A Media `src` names the SOURCE file in media/work/; scripts/encode-media.py
 * writes WebP variants of each into public/work/, and these map a source to
 * the right one:
 *   1680 wide  Retina desktops and laptops
 *    960 wide  1x desktops, phones and small tablets
 * One chooser for everything, so nothing downloads twice.
 *
 * (This file used to carry the Home -> Work formation timeline as well. That
 * environment is gone; the timeline is in _backup-current-site/content/work.ts
 * if it is ever wanted again.)
 */

import { type Media } from "@/content/projects";

export type MediaWidth = 960 | 1680;
const variant = (src: string, suffix: string) => src.replace(/\.(jpe?g|png)$/i, `${suffix}.webp`);

/** The width to serve for a surface this many CSS px wide on this screen.
 *  Density is capped at 2x: past that the difference is not visible on a
 *  photograph, and a phone would otherwise pull the desktop file. */
export const mediaWidth = (surfaceCssPx: number): MediaWidth =>
  surfaceCssPx * Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 2) <= 960 ? 960 : 1680;

/** The still a surface is assembled from — the poster, for video. */
export const stillOf = (m: Media | undefined, w: MediaWidth) =>
  m ? (m.kind === "video" ? m.poster : variant(m.src, `-${w}`)) : undefined;

/**
 * The same media, as a responsive source set. Anything rendered on the server
 * cannot pick a width — it has no device pixel ratio to read — so it hands
 * both to the browser and lets it choose.
 */
export const stillSet = (m: Media | undefined, sizes: string) => {
  if (!m) return null;
  if (m.kind === "video") return m.poster ? { src: m.poster, srcSet: undefined, sizes: undefined } : null;
  return {
    src: variant(m.src, "-960"),
    srcSet: `${variant(m.src, "-960")} 960w, ${variant(m.src, "-1680")} 1680w`,
    sizes,
  };
};
