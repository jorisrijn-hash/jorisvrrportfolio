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

/** Hero. Short enough to be set in display type without wrapping badly. */
export const HERO = {
  statement: "I build interfaces and the systems underneath them.",
  support:
    "Studying ICT, business and data in the Netherlands. Working in design, development and motion in between.",
} as const;

/** 02 — Positioning. The argument for the intersection (§17). */
export const MANIFESTO = {
  lead: "Most work sits inside one discipline.",
  emphasis: "The interesting problems sit between them.",
  body: [
    "A design decision is a technical decision. A technical decision is a business decision. Treating those as separate conversations is how software ends up looking considered and behaving badly — or working correctly and convincing nobody.",
    "I work across all three because the seams are where the real constraints live, and because a system you can see the whole of is a system you can actually improve.",
  ],
} as const;

/** 03 — Currently. Editorial rows, never three SaaS cards (§17). */
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

/** 06 — Profile teaser. The full story lives on /profile. */
export const PROFILE_TEASER = {
  lead: "Before software, cameras.",
  body: "Years of video and cinematography work taught me pacing, framing and how attention actually moves — which turns out to be most of what interface design is. The tools changed. The questions did not.",
} as const;

/** 07 — Closing. One of the most experimental moments on the site (§17). */
export const CLOSING = {
  lines: ["Let's build", "something worth", "remembering."],
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
