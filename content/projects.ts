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
  /**
   * The case study exists for development only: it exercises the section
   * components, and production behaves as though it were absent. Real
   * published case studies leave this off.
   */
  devOnly?: boolean;

  showcaseMedia?: Media;
  heroMedia?: Media;
  galleryMedia?: Media[];
  /**
   * A small stand-in kept with the project. The Work index is typographic —
   * a gallery of thumbnails would compete with the one surface the
   * environment exists to show — so nothing renders this today; it stays
   * because it is real media belonging to the project.
   */
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

/**
 * Development-only case-study material.
 *
 * `devOnly` already keeps it off every surface in production; this keeps it
 * out of the bundle as well. NODE_ENV is inlined at build time, so a
 * production build folds this to an empty object and the material below is
 * dead code the minifier removes.
 */
const devCase = <T extends Partial<Project>>(sections: T): Partial<Project> =>
  process.env.NODE_ENV !== "production" ? sections : {};

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

    /*
     * DEVELOPMENT CASE STUDY.
     *
     * `devOnly` keeps every word of this out of production: it exists to
     * exercise the case-study sections against real material rather than
     * lorem, and every line below is read off this repository — the files
     * named exist, the code is quoted verbatim, and each number carries the
     * script that measured it. Nothing here is marketing copy, and the real
     * case studies (Goodreads, BEBO) will replace it with their own.
     */
    ...devCase({
  devOnly: true,
      context: [
        "This site. A portfolio built as one continuous environment rather than a set of pages: a projected 3D sculpture, a media surface assembled from its cubes, and transitions that carry state between them.",
        "Built under three self-imposed constraints, which is what makes it an engineering project rather than a layout: no WebGL, no canvas, no 3D library. Everything on screen is HTML, CSS and one SVG.",
      ],
      problems: [
        {
          title: "A 3D scene without a 3D renderer",
          body: "The sculpture is a real perspective projection — camera, depth sort, back-face culling — but it has to reach the screen as SVG paths and CSS transforms. Every frame therefore costs DOM writes rather than GPU draw calls, and the naive version of that is unusable.",
        },
        {
          title: "The same environment on a phone",
          body: "The formation that builds the media surface animates hundreds of elements at once. At the desktop grid a mid-range phone dropped a fifth of the frames of that sequence, and the cause was not the sculpture.",
        },
      ],
      requirements: {
        functional: [
          "One environment: Home, Work and About are states of the same scene, not separate pages.",
          "Every transition is reversible, and navigation is refused while one is running.",
          "Case studies are data-driven: a project renders only the sections it actually has.",
          "Sound is opt-in behind a gate, and the interface works in full without it.",
        ],
        nonFunctional: [
          "No WebGL, no canvas, no three.js — SVG, CSS and HTML only.",
          "One requestAnimationFrame loop for the whole application.",
          "Zero React renders per animation frame.",
          "Respects prefers-reduced-motion by settling every state immediately.",
        ],
      },
      architecture: {
        nodes: [
          { id: "browser", label: "Browser", kind: "client" },
          { id: "next", label: "Next.js App Router", kind: "service", note: "static routes, one client experience" },
          { id: "machine", label: "Experience state machine", kind: "client", note: "lib/experience.tsx" },
          { id: "ticker", label: "Frame clock", kind: "client", note: "lib/ticker.ts — one rAF" },
          { id: "scene", label: "Sculpture projection", kind: "client", note: "camera, cull, depth sort — writes SVG paths" },
          { id: "stages", label: "Work / About stages", kind: "client", note: "lib/stages.ts — loaded on demand" },
          { id: "audio", label: "Web Audio engine", kind: "client", note: "opened after the consent gate" },
          { id: "media", label: "Encoded media", kind: "data", note: "public/work — WebP at 960 / 1680" },
          { id: "vercel", label: "Vercel", kind: "external" },
        ],
        edges: [
          { from: "vercel", to: "next", label: "serves" },
          { from: "browser", to: "next", label: "request" },
          { from: "next", to: "machine", label: "hydrate" },
          { from: "machine", to: "stages", label: "on demand" },
          { from: "machine", to: "ticker", label: "subscribe" },
          { from: "machine", to: "audio", label: "cue" },
          { from: "ticker", to: "scene", label: "per frame" },
          { from: "stages", to: "media", label: "fetch" },
        ],
        note: "No server of its own: the whole environment is client state over static routes.",
      },
      database: {
        note: "The site has no database. Its data model is the content layer — one typed source the Work index, the spotlight and the case studies all read.",
        entities: [
          { name: "Project", fields: ["slug", "number", "title", "type", "role[]", "year?", "technologies[]?"], note: "content/projects.ts — everything beyond identity optional" },
          { name: "Media", fields: ["kind", "src", "alt", "width?", "height?", "isPlaceholder?"] },
          { name: "Decision", fields: ["id", "area", "problem", "decision", "implementation?", "result?"] },
          { name: "CodeExample", fields: ["filename", "language", "code", "highlight[]?"] },
          { name: "Challenge", fields: ["title", "problem", "approach?", "wrong?", "solution?", "learned?"] },
          { name: "Metric", fields: ["label", "value", "source"], note: "a number may not exist without the script that measured it" },
        ],
        relations: [
          { from: "Project", to: "Media", kind: "1-n", note: "showcase, hero, thumb, gallery" },
          { from: "Project", to: "Decision", kind: "1-n" },
          { from: "Project", to: "CodeExample", kind: "1-n" },
          { from: "Project", to: "Challenge", kind: "1-n" },
          { from: "Project", to: "Metric", kind: "1-n", note: "through result" },
        ],
      },
      engineeringDecisions: [
        {
          id: "svg-over-webgl",
          area: "Rendering",
          problem: "A rotating sculpture with depth, occlusion and shading, without a 3D library, canvas or WebGL.",
          decision: "Project the geometry in JavaScript and write the result into one SVG element.",
          implementation: "A camera transform per vertex, convex back-face culling, a per-object depth sort, and a fixed pool of <path> slots reused every frame — so the DOM never grows or shrinks while the scene turns.",
          result: "The sculpture holds its frame budget at idle on a 1440 display (300 frames, 0 dropped, scripts/perf-suite.mjs).",
        },
        {
          id: "one-clock",
          area: "Frame budget",
          problem: "The cursor, the sculpture and every transition each wanted their own requestAnimationFrame loop, and they competed for the same vsync.",
          decision: "One frame clock for the whole application; everything that moves subscribes to it.",
          implementation: "lib/ticker.ts keeps a Set of callbacks, parks itself when the set empties, and clamps dt so a backgrounded tab cannot return with one enormous step.",
          result: "A frame is one callback pass, and an idle page costs nothing.",
        },
        {
          id: "attribute-writes",
          area: "Style cost",
          problem: "The sculpture writes thousands of SVG attributes per second, and in Chromium `d`, `fill` and `fill-opacity` are CSS properties — every write invalidates that element's style.",
          decision: "Never write an attribute that has not changed.",
          implementation: "Each path slot caches its last d, fill and opacities; the draw loop compares before writing, and shading is quantised so small numeric drift does not count as a change.",
          result: "Only genuinely changed faces cost style recalculation.",
        },
        {
          id: "no-react-per-frame",
          area: "State",
          problem: "Animating through React state would re-render a large tree sixty times a second.",
          decision: "React owns what exists; the frame clock owns what it looks like.",
          implementation: "Transitions raise data-attributes on a stage element at measured moments, and CSS keyed to those attributes runs the motion. Component state changes once per transition, not once per frame.",
          result: "Zero React renders per animation frame.",
        },
        {
          id: "phone-grid",
          area: "Mobile",
          problem: "Forming the media surface animates the whole grid at once. On a phone the desktop grid of 216 tiles dropped 21 frames of that sequence.",
          decision: "Form the surface from a coarser grid on small screens instead of animating fewer properties.",
          implementation: "lib/layout.ts carries the grid with the rest of the screen-dependent geometry (18x12, or 9x6 when compact); the sculpture's hand-over, the CSS grid and the background offsets all read it, so nothing can drift.",
          result: "The same sequence drops 3 frames, with style recalculation down from 630ms to 368ms (scripts/profile-work.mjs, 390px at 4x CPU throttle).",
        },
        {
          id: "audio-warm",
          area: "Audio",
          problem: "The first sound cue opened the AudioContext and imported the engine synchronously, freezing the first transition it landed in.",
          decision: "Open the audio device while nothing is moving — after the consent gate, never before it.",
          implementation: "The sound API exposes warm(); the experience calls it once the state machine reaches Home, so the device and the module are ready before any cue.",
          result: "A 232ms freeze on the first cue became none (Chrome long-task trace).",
        },
      ],
      codeExamples: [
        {
          filename: "lib/ticker.ts",
          language: "ts",
          note: "The whole frame clock. It parks itself when nothing is subscribed.",
          highlight: [8, 9, 13],
          code: `export type Tick = (now: number, dt: number) => void;

  const subs = new Set<Tick>();
  let raf = 0;
  let last = 0;

  function loop(now: number) {
    // Clamp dt so a backgrounded tab does not return with one enormous step.
    const dt = last ? Math.min(100, now - last) : 16.7;
    last = now;
    subs.forEach((fn) => fn(now, dt));
    if (subs.size) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
      last = 0;
    }
  }

  export function addTick(fn: Tick): () => void {
    subs.add(fn);
    if (!raf && typeof window !== "undefined") raf = requestAnimationFrame(loop);
    return () => removeTick(fn);
  }`,
        },
        {
          filename: "components/home/HomeStage.tsx",
          language: "tsx",
          note: "The inner loop of the sculpture: four comparisons stand between the projection and a style invalidation.",
          highlight: [1, 2, 4, 6],
          code: `if (d !== s.d) { s.d = d; s.el.setAttribute("d", d); }
  if (g !== s.g) { s.g = g; s.el.setAttribute("fill", GRAY[g]); }
  const fa = lite ? q20(face.fa) : q50(face.fa);
  if (fa !== s.fa) { s.fa = fa; s.el.setAttribute("fill-opacity", String(fa)); }
  const sa = lite ? q20(face.sa) : q50(face.sa);
  if (sa !== s.sa) { s.sa = sa; s.el.setAttribute("stroke-opacity", String(sa)); }`,
        },
      ],
      challenges: [
        {
          title: "The profiler was measuring the wrong thing",
          problem: "A tracer written to prove the sculpture's motion stayed continuous reported a regression of more than double after an optimisation that could not have caused one.",
          approach: "Trust the number, and start reverting.",
          wrong: "The tracer selected 176 path nodes when the core has 128, so it was following link geometry as well — and it measured distance per frame, which meant a dropped frame read as a jump.",
          solution: "Select exactly the core paths, and measure velocity per millisecond instead of per frame.",
          learned: "The regression was an artifact, and so was the improvement it had reported earlier. A measurement that cannot be wrong in both directions has not been checked.",
        },
        {
          title: "Optimising the wrong half of the screen",
          problem: "The Work formation dropped a fifth of its frames on a phone, and the sculpture handing its cubes to the surface was the obvious suspect.",
          approach: "Two rounds of work on the sculpture: quantised coordinates and shading, then fewer faces per cube and half the ring dissolved early.",
          wrong: "Together they cut path writes by 40% and moved style recalculation by nothing at all.",
          solution: "An isolation test — the same sequence with the sculpture removed, then with the surface's tiles removed — put 526ms of the 607ms on the tiles. The grid, not the geometry, was the cost.",
          learned: "Profile by removing things, not by guessing at them.",
        },
      ],
      result: {
        body: [
          "The environment runs as one scene: the sculpture, the media surface and the case studies share a camera, a frame clock and a state machine.",
          "It is still in development — these numbers are the current measurements, not a finished claim.",
        ],
        metrics: [
          { label: "Home, idle", value: "300 frames, 0 dropped", source: "scripts/perf-suite.mjs, 1440 at 2x" },
          { label: "Work formation, phone", value: "3 dropped frames (was 21)", source: "scripts/profile-work.mjs, 390px at 4x CPU throttle" },
          { label: "Style recalculation, phone", value: "368ms (was 630ms)", source: "scripts/profile-work.mjs, same run" },
          { label: "First sound cue", value: "no long task (was 232ms)", source: "Chrome long-task trace" },
          { label: "rAF loops", value: "1", source: "lib/ticker.ts" },
        ],
      },
    }),
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

/**
 * A project opens a case study only once it has something real to show — and
 * a dev-only one shows nowhere but development.
 */
export const hasCaseStudy = (p: Project, allowDev = process.env.NODE_ENV !== "production") =>
  !p.comingSoon &&
  (!p.devOnly || allowDev) &&
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
