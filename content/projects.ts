/**
 * PROJECTS — the one source for the Work index, the Featured Work spotlight
 * and the case studies.
 *
 * TWO RULES HOLD THIS FILE TOGETHER:
 *
 * 1. Everything beyond the identity of a project is OPTIONAL. A project that
 *    has no year, no stack, no architecture and no result simply has those
 *    fields absent, and every surface omits what is absent — it never
 *    substitutes a guess, a dash or a lorem line. Different projects can
 *    therefore have completely different case studies.
 *
 * 2. Nothing here may be invented. Titles, types and roles below were given
 *    by Joris; jorisvrr.com's stack and year are read off this repository.
 *    Everything still unknown (Goodreads' and BEBO's stack, dates, URLs,
 *    decisions, code, results) is simply missing, and stays missing until the
 *    real material exists. Placeholder MEDIA is allowed, but must be flagged
 *    `isPlaceholder`, which the interface labels as such.
 */

export type MediaKind = "image" | "video";

export type Media = {
  kind: MediaKind;
  /** the SOURCE path in media/work/; scripts/encode-media.py writes the
   *  WebP variants the site serves (content/work.ts maps source -> served) */
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** video only */
  poster?: string;
  /** generated stand-in, not the real project: the interface says so */
  isPlaceholder?: boolean;
};

/* ---- case-study sections. Every one optional; absent = the section is not
       rendered at all, for that project. ---------------------------------- */

export type ArchitectureNode = { id: string; label: string; kind?: "client" | "service" | "data" | "external"; note?: string };
export type ArchitectureEdge = { from: string; to: string; label?: string };
export type Architecture = { nodes: ArchitectureNode[]; edges: ArchitectureEdge[]; note?: string };

export type Entity = { name: string; fields?: string[]; note?: string };
export type Relation = { from: string; to: string; kind: "1-1" | "1-n" | "n-n"; note?: string };
export type DatabaseModel = { entities: Entity[]; relations?: Relation[]; note?: string };

/** The engineering thinking, not a list of technologies. */
export type Decision = {
  id: string;
  area: string;
  problem: string;
  decision: string;
  implementation?: string;
  result?: string;
};

export type CodeExample = {
  filename: string;
  language: string;
  code: string;
  /** 1-indexed lines to mark */
  highlight?: number[];
  note?: string;
};

export type Challenge = {
  title: string;
  problem: string;
  approach?: string;
  wrong?: string;
  solution?: string;
  learned?: string;
};

/** Measured, with where the number comes from. Never estimated. */
export type Metric = { label: string; value: string; source: string };

export type Project = {
  slug: string;
  /** "01" — the index number shown in the Work environment */
  number: string;
  title: string;
  subtitle?: string;
  /** "Full-stack application", "Client website" — what kind of thing it is */
  type: string;
  role?: string[];
  year?: string;
  technologies?: string[];
  /** a short system label for its state, when there is something true to say */
  status?: string;
  featured?: boolean;
  /** listed in the index, but opens nothing and claims nothing */
  comingSoon?: boolean;

  showcaseMedia?: Media;
  heroMedia?: Media;
  galleryMedia?: Media[];
  /** the small image in the Work index */
  thumbMedia?: Media;

  liveUrl?: string;
  githubUrl?: string;

  context?: string[];
  problems?: { title: string; body: string; media?: Media }[];
  requirements?: { functional?: string[]; nonFunctional?: string[] };
  architecture?: Architecture;
  database?: DatabaseModel;
  engineeringDecisions?: Decision[];
  codeExamples?: CodeExample[];
  product?: { body?: string[]; media?: Media[] };
  challenges?: Challenge[];
  result?: { body?: string[]; metrics?: Metric[]; media?: Media[] };

  seo?: { title?: string; description?: string; keywords?: string[] };
  openGraph?: { title?: string; description?: string; image?: string };
};

/* ------------------------------------------------------------------ data */

/** The generated abstract stand-ins (scripts/gen-work-placeholders.py). */
const placeholder = (n: string): Media => ({
  kind: "image",
  src: `/work/placeholder-${n}.jpg`,
  alt: `Placeholder media for project ${n}`,
  width: 1680,
  height: 1074,
  isPlaceholder: true,
});
const placeholderThumb = (n: string): Media => ({
  kind: "image",
  src: `/work/placeholder-${n}-thumb.jpg`,
  alt: "",
  width: 320,
  height: 205,
  isPlaceholder: true,
});

export const PROJECTS: Project[] = [
  {
    slug: "goodreads",
    number: "01",
    title: "Goodreads",
    type: "Full-stack application",
    role: ["Full-stack development", "Product design"],
    featured: true,
    showcaseMedia: placeholder("01"),
    thumbMedia: placeholderThumb("01"),
    // Stack, dates, URLs and every case-study section are deliberately absent
    // until the real project material is in.
  },
  {
    slug: "bebo",
    number: "02",
    title: "BEBO",
    type: "Client website",
    role: ["Web development", "Production"],
    showcaseMedia: placeholder("02"),
    thumbMedia: placeholderThumb("02"),
  },
  {
    slug: "jorisvrr",
    number: "03",
    title: "jorisvrr.com",
    type: "Portfolio",
    role: ["Frontend", "Interaction engineering"],
    year: "2026",
    // Read off this repository: package.json, and what the code actually uses.
    technologies: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Motion", "d3-geo", "Web Audio API", "Vercel"],
    liveUrl: "https://jorisvrr.com",
    showcaseMedia: placeholder("03"),
    thumbMedia: placeholderThumb("03"),
  },
  {
    slug: "java-backend",
    number: "04",
    title: "Java / Backend",
    type: "Coming soon",
    comingSoon: true,
    status: "Coming soon",
    thumbMedia: placeholderThumb("04"),
  },
];

export const PROJECT_BY_SLUG: Record<string, Project> = Object.fromEntries(PROJECTS.map((p) => [p.slug, p]));

/** The project the Featured Work spotlight presents (checkpoint 2). */
export const FEATURED = PROJECTS.find((p) => p.featured) ?? PROJECTS[0];

/** A project opens a case study only once it has something real to show. */
export const hasCaseStudy = (p: Project) =>
  !p.comingSoon &&
  Boolean(
    p.context?.length ||
      p.problems?.length ||
      p.requirements ||
      p.architecture ||
      p.database ||
      p.engineeringDecisions?.length ||
      p.codeExamples?.length ||
      p.product ||
      p.challenges?.length ||
      p.result,
  );
