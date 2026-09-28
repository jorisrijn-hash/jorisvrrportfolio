/**
 * THE PORTFOLIO, AS CONTENT.
 *
 * One file for everything the page says, so changing the site is a content
 * edit rather than a code edit. The rules that held for the previous site
 * hold here: nothing is claimed that is not true, and anything unconfirmed is
 * absent rather than guessed. Where a section has no material yet, it says so
 * in the interface instead of being filled in.
 *
 * Sources: content/site.ts (name, contact, socials — unchanged since the
 * previous site), content/projects.ts (the Goodreads case study, built from
 * that project's own repository), and the rebuild brief of 2026-09-29 for the
 * positioning and the study programme.
 */

import { SITE, SOCIALS } from "@/content/site";

export const IDENTITY = {
  name: SITE.name,
  first: "Joris",
  last: "van Rijn",
  /** what the site is about, in five words */
  discipline: "Software Engineering × Digital Systems",
  location: "Leiderdorp / NL",
  /** the hero's bottom-right system status */
  status: "Available for internship",
  email: SITE.email,
  domain: SITE.domain,
} as const;

/** The lines that run across the hero. Alternating direction, in this order. */
export const HERO_LINES = [
  { text: "SOFTWARE ENGINEER", dir: 1 },
  { text: "FULL-STACK DEVELOPER", dir: -1 },
  { text: "DIGITAL SYSTEMS", dir: 1 },
  { text: "BUSINESS × TECHNOLOGY", dir: -1 },
] as const;

export const ABOUT = {
  label: "(01)",
  heading: "About",
  lead: "I build digital products and software at the intersection of technology, business and design.",
  body: [
    "I study HBO-ICT at De Haagse Hogeschool, on the software engineering track. What interests me is the system behind a product — the interfaces, the APIs, the data, the processes, and the way people actually end up using it.",
    "My background is in visual design and filmmaking, which is where I learned to communicate an idea. It gives me a different way into development: I care how something is built, but also why it exists, what it costs the business, and how the finished thing feels to use.",
  ],
  /** Metadata, not a skills résumé: no bars, no percentages, no years. */
  stack: [
    "Java", "React", "Next.js", "TypeScript", "SQL", "Supabase",
    "APIs", "Git / GitHub", "Docker", "UI / UX", "Data", "Process optimization",
  ],
} as const;

export const WORK_INTRO = {
  heading: "Selected work",
  note: "Two projects — one client, one my own",
} as const;

/**
 * FEATURED WORK — exactly two.
 *
 * `caseStudy` points at a real page only when one exists; BEBO has none, and
 * the interface says what is true instead (the client's site is a holding
 * page today: "Onze website is in ontwikkeling", checked 2026-09-29).
 */
export const FEATURED = [
  {
    number: "(01)",
    kind: "Client / Development",
    year: "2026",
    title: ["BEBO", "Betonboren"],
    slug: "bebo",
    summary:
      "A digital platform for a concrete drilling and sawing company — taking a traditional service business and giving it a clearer, more professional presence and a way of handling the work that comes in.",
    meta: [
      { label: "Role", value: "Development · Product · UX" },
      { label: "Client", value: "BEBO betonboren & zagen" },
      { label: "Type", value: "Client project" },
      { label: "Status", value: "In development" },
    ],
    media: {
      src: "/work/bebo-home",
      alt: "bebobetonboren.nl as it stands today: the holding page, on raw concrete",
      caption: "bebobetonboren.nl — the live holding page while the platform is built",
    },
    action: { label: "Visit the live site", href: "https://www.bebobetonboren.nl/", external: true },
    /** no case study yet, and none is implied */
    caseStudy: null as string | null,
  },
  {
    number: "(02)",
    kind: "Software / Development",
    year: "2026",
    title: ["Goodreads", "Rebuilt"],
    slug: "goodreads",
    summary:
      "An independent Goodreads redesign built as a working system: a 9,021-book catalogue ingested from Open Library, hybrid search in PostgreSQL that survives a typo, server-side sessions, and a Spring Boot API that owns every domain decision.",
    meta: [
      { label: "Role", value: "Full-stack · Backend · Data" },
      { label: "Stack", value: "Java · Spring Boot · PostgreSQL · Next.js" },
      { label: "Type", value: "Personal project" },
      { label: "Status", value: "Phase 1 — core reading system" },
    ],
    media: {
      src: "/work/goodreads-discover",
      alt: "Goodreads rebuilt: the catalogue as one surface, with a genre rail of real covers and search",
      caption: "Discover — browse and search as one surface, served from our own PostgreSQL",
    },
    action: { label: "Read the case study", href: "/work/goodreads", external: false },
    caseStudy: "/work/goodreads",
  },
] as const;

export const STATEMENT = {
  lines: [
    ["I don't just want to build", "what's on the screen."],
    ["I want to understand", "what's behind it."],
  ],
  body:
    "Good digital products aren't only interfaces. They're the systems, the data, the processes and the decisions that make those interfaces work — and they are usually where the real problem is.",
} as const;

/**
 * WHAT I WORK WITH — categories, each with the things inside it. The keywords
 * are what I actually work with as a student, not a claim of expertise.
 */
export const FOCUS = {
  label: "(02)",
  heading: "What I work with",
  items: [
    { id: "software", title: "Software", keywords: ["Java", "React", "Next.js", "APIs", "Backend", "Full-stack"] },
    { id: "products", title: "Digital products", keywords: ["Web applications", "Interfaces", "Prototypes", "Product thinking"] },
    { id: "data", title: "Data & systems", keywords: ["SQL", "Supabase", "Data modelling", "System architecture"] },
    { id: "ux", title: "UX / UI", keywords: ["User flows", "Wireframes", "Interaction", "Design systems"] },
    { id: "business", title: "Business", keywords: ["Business analysis", "Process optimization", "Digital strategy", "Stakeholders"] },
  ],
} as const;

export const PROCESS = {
  label: "(03)",
  heading: ["From problem", "to system", "to product."],
  steps: [
    { n: "01", title: "Understand", text: "What is actually happening, and for whom?" },
    { n: "02", title: "Structure", text: "What does the system need to be true?" },
    { n: "03", title: "Build", text: "How can technology solve it, concretely?" },
    { n: "04", title: "Refine", text: "Does it work when someone really uses it?" },
  ],
} as const;

export const CURRENTLY = {
  label: "Currently",
  school: "De Haagse Hogeschool",
  programme: "HBO-ICT — Software Engineering",
  years: "2026 — 2030",
  place: "Den Haag, Netherlands",
  focus: [
    "Software engineering",
    "Backend development",
    "Full-stack development",
    "Data & systems",
    "Digital product development",
  ],
} as const;

export const CONTACT = {
  label: "(04)",
  heading: ["Have a project", "or an opportunity?"],
  body: "I'm looking for an internship where I can grow through real software development — building things that people actually use, in a team that builds them properly.",
  cta: { label: "Get in touch", href: `mailto:${SITE.email}` },
} as const;

/** Channels. LinkedIn is the one that matters here; Instagram carries over
 *  from the previous site. */
export const LINKS = [
  { label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
  { label: "LinkedIn", value: "in/jorisvnrijn", href: "https://www.linkedin.com/in/jorisvnrijn/" },
  { label: "Instagram", value: "@jorisvrr", href: SOCIALS.find((s) => s.id === "instagram")!.href },
] as const;

export const FOOTER = {
  lines: ["Let's", "build", "something."],
  year: "2026",
} as const;

export const NAV = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
] as const;
