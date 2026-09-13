/**
 * LAB REGISTRY
 *
 * The Lab is the part of this site designed to grow (§19). It documents
 * experiments and learning, so entries are small and frequent — a motion
 * study, a Java exercise, a visualisation, a utility.
 *
 * Also empty on purpose. Add entries here and /lab plus the homepage preview
 * pick them up with no other changes.
 */

export type LabKind =
  | "interaction"
  | "motion"
  | "graphics"
  | "data"
  | "software"
  | "note";

export type LabEntry = {
  /** Zero-padded, stable, never reused: "001". */
  index: string;
  slug: string;
  title: string;
  /** One or two lines. What it is and what it was for. */
  summary: string;
  kind: LabKind;
  year: string;
  href?: string;
  /** Optional inline media. Video and canvas demos are lazy-loaded. */
  media?: { type: "video" | "image"; src: string; alt?: string };
};

export const LAB: LabEntry[] = [];

/* Shape reference:
 *
 * {
 *   index: "001",
 *   slug: "cursor-fields",
 *   title: "Cursor fields",
 *   summary: "Pointer-driven distortion across a line grid. 60fps on a 2019 MBP.",
 *   kind: "motion",
 *   year: "2026",
 * }
 */

export const KIND_LABEL: Record<LabKind, string> = {
  interaction: "Interaction",
  motion: "Motion",
  graphics: "Graphics",
  data: "Data",
  software: "Software",
  note: "Note",
};

/**
 * The territories the Lab covers. These are NOT projects — they are the
 * standing categories, shown on the homepage strip so the scene has real
 * structure before any entry exists. Each gets a generated geometric glyph.
 *
 * When LAB fills up, the homepage strip shows real entries instead and these
 * become the filter set for /lab.
 */
export const LAB_TRACKS: { index: string; title: string; kind: LabKind }[] = [
  { index: "001", title: "Type / Motion", kind: "motion" },
  { index: "002", title: "Network / Trace", kind: "data" },
  { index: "003", title: "Java / System", kind: "software" },
  { index: "004", title: "Interaction", kind: "interaction" },
  { index: "005", title: "Generative", kind: "graphics" },
];
