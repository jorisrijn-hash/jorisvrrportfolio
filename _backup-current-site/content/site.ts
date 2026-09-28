/**
 * SITE COPY
 *
 * Edited often; kept out of components so updating the site is a content
 * change, not a code change.
 */

export const SITE = {
  name: "Joris van Rijn",
  domain: "jorisvrr.com",
  location: "The Netherlands",
  email: "jorisvrr@gmail.com",
  version: "1.0.0",
  study: "HBO-ICT Business & Data Management",
} as const;

/** ABOUT — the one place longer text is allowed, and only once opened. */
export const ABOUT = {
  /** The line the About state opens on. */
  lead: "I'm interested in what happens between a business problem and a working solution.",

  /** Short-form summary, shown in the About panel. */
  summary:
    "HBO-ICT Business & Data Management student with a background in visual design and digital media, interested in the intersection of business, technology, data and user experience.",

  /** Long-form, revealed on deeper About content. */
  body: [
    "I enjoy understanding how businesses and digital products work, identifying problems or inefficiencies, and developing practical solutions through interface design, software, data and process improvement.",
    "My background started in visual design and filmmaking, which taught me how to communicate ideas and think creatively. Today, through HBO-ICT Business & Data Management, I'm developing the technical and analytical side of that skill set.",
    "I'm most interested in projects where I can understand how a business or product currently works, identify where it can improve, and turn that into something tangible — whether that means designing a better interface, improving a process, working with data or building a digital system.",
    "My goal is to develop strong technical and analytical expertise without losing sight of the complete process: from understanding the initial business problem and designing a solution to implementation, iteration and measuring its impact.",
    "Long term, I want to be able to connect business, design and technology rather than seeing them as separate disciplines.",
  ],

  /** Contact details shown in the About META panel. `href` makes a row a link. */
  meta: [
    { label: "Name", value: "Joris van Rijn" },
    { label: "Email", value: "jorisvrr@gmail.com", href: "mailto:jorisvrr@gmail.com" },
    { label: "Phone", value: "0638032065", href: "tel:+31638032065" },
    { label: "Location", value: "The Netherlands" },
    { label: "Website", value: "jorisvrr.com", href: "https://jorisvrr.com", external: true },
  ] as { label: string; value: string; href?: string; external?: boolean }[],
} as const;

/**
 * ABOUT, continued — the scrollable part below the opening composition.
 * Drawn from the same story as ABOUT.body, restructured rather than repeated.
 */
export const PROFILE = {
  trajectory: {
    heading: "From making images to shaping systems.",
    rows: [
      { label: "Before", text: "Visual design and filmmaking — learning to communicate ideas and think creatively." },
      { label: "Now", text: "HBO-ICT Business & Data Management — building the technical and analytical side." },
      { label: "Next", text: "Connecting business, design and technology instead of treating them as separate disciplines." },
    ],
  },
  disciplines: {
    heading: "Where I work.",
    items: ["Interface & UX design", "Visual design", "Film & motion", "Data & analysis", "Process improvement", "Digital systems"],
  },
  method: {
    heading: "How I think.",
    steps: [
      { label: "Understand", text: "How the business or product works today." },
      { label: "Identify", text: "Where it can improve, and why it matters." },
      { label: "Build", text: "Make it tangible: an interface, a process, data or a system." },
      { label: "Measure", text: "Iterate on its real impact." },
    ],
  },
  /** Tools and software. The section only renders once this has entries. */
  tools: [] as string[],
} as const;

/**
 * External channels, in the About LINKS panel and as nodes on the globe.
 * LinkedIn is confirmed. Instagram and YouTube are still UNVERIFIED: assumed
 * from the domain (jorisvrr) — confirm they point to the right profiles.
 */
export const SOCIALS = [
  { id: "instagram", label: "Instagram", handle: "@jorisvrr", href: "https://www.instagram.com/jorisvrr" },
  { id: "youtube", label: "YouTube", handle: "@jorisvrr", href: "https://www.youtube.com/@jorisvrr" },
  { id: "linkedin", label: "LinkedIn", handle: "in/jorisvnrijn", href: "https://www.linkedin.com/in/jorisvnrijn/" },
] as const;
