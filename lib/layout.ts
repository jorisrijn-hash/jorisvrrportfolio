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

export type PlaneSpec = { x: number; y: number; yaw: number; w: number; h: number; cols: number; rows: number };

/**
 * FEATURED WORK — a system notification, not a state.
 *
 * The panel is placed in VIEWPORT pixels (lower-right on a desktop, above the
 * dock on a phone), because a notification is positioned against the screen
 * rather than against the sculpture. The display inside it is the Work
 * surface, so the rectangle it occupies is converted back into scene units:
 * that is where the sculpture's cubes fly, and what the CSS surface scales
 * itself to. One rectangle, two coordinate systems, no drift.
 *
 *   panel   px, relative to the viewport — the notification's frame
 *   plane   scene units around the stage centre — the display inside it
 */
export type PanelRect = { x: number; y: number; w: number; h: number; pad: number; head: number; foot: number };
export type SpotlightSpec = { scale: number; dx: number; dy: number; plane: PlaneSpec; panel: PanelRect };

/**
 * The display's rectangle in px becomes the scale and offset the surface and
 * the cubes share. Facing the camera (yaw 0), because a turned plane inside a
 * square frame would not sit in it.
 */
const spotlightAt = (
  /** the Work plane this screen uses — the desktop reference, or the
   *  recomposed compact one. The transform carries THAT onto the display. */
  from: PlaneSpec,
  media: { x: number; y: number; w: number },
  panel: PanelRect,
  vw: number,
  vh: number,
  fit: number,
  stageY: number,
  cols: number,
  rows: number,
): SpotlightSpec => {
  const w = media.w / fit;                       // scene units
  const scale = w / from.w;
  const h = from.h * scale;
  const x = (media.x - vw / 2) / fit;
  const y = (media.y - vh * stageY) / fit;
  return {
    scale,
    // the transform that carries this screen's Work plane onto that rectangle
    dx: x - from.x * scale,
    dy: y - from.y * scale,
    plane: { x, y, yaw: 0, w, h, cols, rows },
    panel,
  };
};

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
  /** the Featured Work surface: the Work plane, smaller and set aside */
  spotlight: SpotlightSpec;
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

/**
 * THE NOTIFICATION PANEL.
 *
 * Desktop: set into the lower right, roughly a third of the screen across and
 * a third down it, well clear of the navigation, the corner marks and the
 * sculpture in the middle. A phone gets the full width above the dock, which
 * is where a phone puts a notification.
 *
 * The display inside takes a little under half the width — enough to prove
 * the project exists, not enough to become the scene. Everything else is the
 * identity beside it and one action under it.
 */
const notification = (
  from: PlaneSpec,
  vw: number,
  vh: number,
  fit: number,
  stageY: number,
  safe: { t: number; r: number; b: number; l: number },
  compact: boolean,
): SpotlightSpec => {
  const pad = compact ? 16 : 20;
  const head = compact ? 26 : 30;               // system label / close
  const foot = compact ? 46 : 42;               // the action row
  const gap = compact ? 12 : 14;

  const w = compact
    ? Math.min(520, vw - 24 - safe.l - safe.r)
    : Math.max(380, Math.min(520, Math.round(vw * 0.3)));
  // the display: 44% of the panel on a desktop, a little less on a phone
  const mw = Math.round((w - pad * 2) * (compact ? 0.42 : 0.46));
  const mh = Math.round((mw / from.w) * from.h);
  // the identity column needs at least this much beside the display
  const bodyH = Math.max(mh, compact ? 92 : 104);
  const h = pad * 2 + head + gap + bodyH + gap + foot;

  const x = compact
    ? Math.round((vw - w) / 2)
    : Math.round(vw - w - (56 + safe.r));
  const y = compact
    ? Math.round(vh - h - (safe.b + 86))        // above the dock
    : Math.round(vh - h - (safe.b + 72));

  const panel: PanelRect = { x, y, w, h, pad, head, foot };
  const media = { x: x + pad, y: y + pad + head + gap, w: mw };
  // A fraction of the Work grid: the display is a fraction of the size, so it
  // forms from 48 tiles on a desktop and 24 on a phone, not 216 — and only
  // the 26 (13) of them the sculpture feeds cost a flight at all.
  return spotlightAt(from, media, panel, vw, vh, fit, stageY, compact ? 6 : 8, compact ? 4 : 6);
};

export function computeLayout(): Layout {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const safe = safeInsets();
  const compact = window.matchMedia(COMPACT_QUERY).matches;

  if (!compact) {
    const fit = Math.min(1.25, Math.max(0.5, Math.min(vw / 1920, vh / 950)));
    const plane = { x: PLANE.x, y: PLANE.y, yaw: PLANE.yaw, w: PLANE.w, h: PLANE.h, cols: PLANE.cols, rows: PLANE.rows };
    return {
      compact, lite: false, vw, vh, fit, stageY: 0.495,
      plane,
      spotlight: notification(plane, vw, vh, fit, 0.495, safe, false),
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

  // A quarter of the cells on a phone: the surface still forms from tiles,
  // but 54 of them rather than 216. Measured on a 4x-throttled phone, the
  // cells (not the sculpture) were the whole cost of the formation — 607ms
  // of style recalc, against 189ms with them hidden.
  const plane = { x: (left - vw / 2) / fit, y, yaw: 6, w, h, cols: PLANE.cols / 2, rows: PLANE.rows / 2 };
  return {
    compact, lite: true, vw, vh, fit, stageY,
    plane,
    // A phone gets the same notification across the lower screen, clear of
    // the dock — never the whole display.
    spotlight: notification(plane, vw, vh, fit, stageY, safe, true),
    flat: { x: -w / 2, y },
    mediaBottom: top + hs,
    globeFit: Math.min(vw / 720, vh / 1300),
    globeY: 0.4,
    safe,
  };
}

/**
 * THE CASE-STUDY HANDOVER.
 *
 * Opening a case study, the Work surface turns to face the camera and grows
 * until it fills the screen — and the case study's hero then takes over that
 * exact rectangle. Both show the same image at the same crop, because the
 * plane and the media share one aspect ratio (840:537 = 1680:1074), so the
 * moment one replaces the other is invisible.
 *
 * Returned in the same terms as the spotlight: a scale and an offset applied
 * to the Work origin, in scene units.
 */
export const caseSurface = (L: Layout) => {
  const scale = Math.max(L.vw / L.fit / L.plane.w, L.vh / L.fit / L.plane.h);
  const cx = L.plane.x + L.plane.w / 2;
  const cy = L.plane.y + L.plane.h / 2;
  return {
    scale,
    // the plane's centre, brought to the centre of the viewport
    dx: -cx * scale,
    dy: (L.vh * (0.5 - L.stageY)) / L.fit - cy * scale,
  };
};
