"use client";

import { PLANE } from "@/content/work";

/**
 * LAYOUT — every screen-dependent number, computed in one place.
 *
 * The sculpture (SVG, JS projection), the Work surface (CSS 3D), the About
 * globe and the Work <-> About panel mapping all read the same object, so they
 * cannot disagree about where the stage centre or the media plane is.
 *
 *   desktop  the reference values, measured at 1920x950 and fitted
 *   compact  phones and small tablets: a recomposed stage, not a scaled one
 *
 * The CSS side uses the same query (app/experience.css COMPACT section).
 */
export const COMPACT_QUERY = "(max-width: 900px), (max-aspect-ratio: 4/5)";

export type PlaneSpec = { x: number; y: number; yaw: number; w: number; h: number };

export type Layout = {
  compact: boolean;
  /** drop low-priority geometry (the far orbit) and halve idle redraws */
  lite: boolean;
  vw: number;
  vh: number;
  /** scene/CSS units -> px */
  fit: number;
  /** stage centre as a fraction of the viewport height */
  stageY: number;
  /** the Work media plane, scene units around the stage centre */
  plane: PlaneSpec;
  /** the plane's origin once it faces the camera (Work <-> About) */
  flat: { x: number; y: number };
  /** screen px where the media ends — compact info sits below it */
  mediaBottom: number;
  globeFit: number;
  globeY: number;
  safe: { t: number; r: number; b: number; l: number };
};

let probe: HTMLDivElement | null = null;

/** env(safe-area-inset-*) resolved to px, read from a hidden probe. */
function safeInsets() {
  if (!probe) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
      "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
    document.body.appendChild(probe);
  }
  const cs = getComputedStyle(probe);
  return {
    t: parseFloat(cs.paddingTop) || 0,
    r: parseFloat(cs.paddingRight) || 0,
    b: parseFloat(cs.paddingBottom) || 0,
    l: parseFloat(cs.paddingLeft) || 0,
  };
}

export function computeLayout(): Layout {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const safe = safeInsets();
  const compact = window.matchMedia(COMPACT_QUERY).matches;

  if (!compact) {
    const fit = Math.min(1.25, Math.max(0.5, Math.min(vw / 1920, vh / 950)));
    return {
      compact, lite: false, vw, vh, fit, stageY: 0.495,
      plane: { x: PLANE.x, y: PLANE.y, yaw: PLANE.yaw, w: PLANE.w, h: PLANE.h },
      flat: { x: -420, y: -280 },
      mediaBottom: 0,
      globeFit: fit,
      globeY: 0.495,
      safe,
    };
  }

  // The sculpture is sized to the silhouette that matters (ring + cluster,
  // ~880 x 1040 scene units), and the stage lifts to leave room for the dock.
  const stageY = 0.45;
  const fit = Math.max(0.24, Math.min((vw * 0.92) / 880, (vh * 0.52) / 1040));

  // Work: the media spans the width near the top, on a flatter plane.
  const aspect = PLANE.w / PLANE.h;
  const shortLandscape = vh < 520 && vw > vh;
  const top = safe.t + (shortLandscape ? 60 : 74);
  let ws = Math.min(vw - 32 - safe.l - safe.r, 640);
  let left = (vw - ws) / 2;
  if (shortLandscape) {
    ws = Math.min(vw / 2 - 28 - safe.l, (vh - top - 20 - safe.b) * aspect);
    left = 16 + safe.l;
  }
  const hs = ws / aspect;
  const w = ws / fit;
  const h = hs / fit;
  const y = (top - vh * stageY) / fit;

  return {
    compact, lite: true, vw, vh, fit, stageY,
    plane: { x: (left - vw / 2) / fit, y, yaw: 6, w, h },
    flat: { x: -w / 2, y },
    mediaBottom: top + hs,
    globeFit: Math.min(vw / 720, vh / 1300),
    globeY: 0.4,
    safe,
  };
}
