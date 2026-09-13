/**
 * WORK REGISTRY
 *
 * Deliberately EMPTY. The brief is explicit: do not fake a portfolio (§18).
 * /work renders a considered empty state until real entries land here, and
 * every surface that lists work already handles the empty case.
 *
 * To publish a project, add an entry to `WORK` below. Nothing else needs to
 * change — routing, /work/[slug], the index and the homepage feature slot all
 * read from this array.
 */

export type WorkStatus = "case-study" | "concept" | "in-progress" | "archive";

export const STATUS_LABEL: Record<WorkStatus, string> = {
  "case-study": "Case study",
  concept: "Concept",
  "in-progress": "In progress",
  archive: "Archive",
};

export type WorkEntry = {
  slug: string;
  /** Display title. Kept short — it is set in large display type. */
  title: string;
  /** One line, concrete. No "crafting digital experiences" (§21). */
  summary: string;
  status: WorkStatus;
  year: string;
  /** e.g. ["Design", "Next.js", "Systems"] — shown as mono metadata. */
  disciplines: string[];
  /** Promotes this entry to the homepage feature slot. At most one. */
  featured?: boolean;
  /** Long-form body. Plain paragraphs now; can become MDX later. */
  body?: string[];
  /** External link, if the work lives somewhere else. */
  href?: string;
};

export const WORK: WorkEntry[] = [];

/* Shape reference — copy, uncomment, edit:
 *
 * {
 *   slug: "modus",
 *   title: "Modus",
 *   summary: "A booking and diagnostic platform for a service business.",
 *   status: "in-progress",
 *   year: "2026",
 *   disciplines: ["Product design", "Next.js", "Systems"],
 *   featured: true,
 *   body: [
 *     "What the problem was.",
 *     "What you decided and why.",
 *     "What it changed.",
 *   ],
 * }
 */

export function getWork(slug: string): WorkEntry | undefined {
  return WORK.find((w) => w.slug === slug);
}

export function featuredWork(): WorkEntry | undefined {
  return WORK.find((w) => w.featured) ?? WORK[0];
}
