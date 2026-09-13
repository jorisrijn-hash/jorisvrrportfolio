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

  /** Mono metadata shown beside the About panels. */
  meta: [
    ["Module", "Profile_Node"],
    ["Study", "HBO-ICT Business & Data Management"],
    ["Focus", "Business · Technology · Data · UX"],
    ["Origin", "Visual design / Filmmaking"],
    ["Location", "The Netherlands"],
  ] as const,
} as const;
