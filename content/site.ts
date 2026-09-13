/**
 * SITE COPY + PROFILE DATA
 *
 * Everything here is meant to be edited often. Keeping it out of the
 * components means updating the site is a content change, not a code change.
 *
 * Copy rules (§21): concrete, confident, understated. No "passionate about",
 * no "crafting digital experiences", no "bringing your vision to life".
 */

export const SITE = {
  name: "Joris van Rijn",
  domain: "jorisvrr.com",
  location: "The Netherlands",
  email: "jorisvrr@gmail.com",
  availability: "Available for select opportunities",
  disciplines: ["Design", "Technology", "Systems"],
} as const;

/** SCENE 01 — Hero. The name carries the scene; these are the only support. */
export const HERO = {
  support:
    "Studying ICT, business and data in the Netherlands. Design, development and motion in between.",
} as const;

/**
 * SCENE 02 — Positioning. One row per discipline; each owns a viewport row and
 * gains weight on scroll. Notes are deliberately short — they sit tiny beside
 * type at --text-scene.
 */
export const POSITIONING: { word: string; note: string }[] = [
  {
    word: "Design",
    note: "Typography, interface, art direction. The part that decides whether anyone trusts the thing.",
  },
  {
    word: "Technology",
    note: "TypeScript, React, Java. Building it myself is what keeps the design honest.",
  },
  {
    word: "Systems",
    note: "Data models, process, constraints. Where a design decision quietly becomes a business decision.",
  },
];

/** SCENE 03 — Statement. A title card. One thought, nothing else. */
export const STATEMENT = {
  lines: [
    "I like the space",
    "between an idea",
    "and the system",
    "that makes it work.",
  ],
} as const;

/** SCENE 04 — Currently. Drives the sticky typographic sequence. */
export const CURRENTLY: { label: string; items: string[] }[] = [
  {
    label: "Building",
    items: [
      "Interfaces and internal tools in TypeScript and Next.js",
      "This site, as a long-running design system rather than a template",
    ],
  },
  {
    label: "Learning",
    items: [
      "Java, and how object models hold up outside the browser",
      "Data modelling — the part of business that is really schema design",
    ],
  },
  {
    label: "Exploring",
    items: [
      "Motion as interface language, not decoration",
      "Generative and procedural graphics on canvas",
    ],
  },
];

/** SCENE 07 — Profile teaser. The full story lives on /profile. */
export const PROFILE_TEASER = {
  lead: "Before software, cameras.",
  body: "Years of video and cinematography work taught me pacing, framing and how attention actually moves — which turns out to be most of what interface design is. The tools changed. The questions did not.",
} as const;

/** SCENE 08 — Closing. */
export const CLOSING = {
  lines: ["Let's make", "something", "interesting."],
  action: "Contact",
} as const;

/** /profile — timeline. Newest first. */
export const TIMELINE: { period: string; title: string; detail: string }[] = [
  {
    period: "2026 —",
    title: "ICT, Business & Data",
    detail: "Studying the systems side: data modelling, process, and how software earns its place in a business.",
  },
  {
    period: "2024 —",
    title: "Independent web development",
    detail: "Designing and building sites and tools for small businesses in the Netherlands. Full responsibility, from brief to deployment.",
  },
  {
    period: "2020 —",
    title: "Video and cinematography",
    detail: "Shooting and editing. Where the interest in timing, composition and attention started.",
  },
];

/** /profile — capabilities. Disciplines, not percentage bars (§20). */
export const CAPABILITIES: { group: string; items: string[] }[] = [
  {
    group: "Design",
    items: ["Interface design", "Typography", "Art direction", "Motion design", "Design systems"],
  },
  {
    group: "Development",
    items: ["TypeScript", "React & Next.js", "Java", "CSS architecture", "Web animation"],
  },
  {
    group: "Systems",
    items: ["Data modelling", "Process design", "Technical writing", "Requirements"],
  },
];
