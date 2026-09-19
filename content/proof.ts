/**
 * SOCIAL PROOF — testimonials, revealed by scrolling Home.
 *
 * PLACEHOLDERS ONLY, for now. Every entry below is marked isPlaceholder and
 * is not a real statement by a real person. Placeholders are only ever shown
 * in development, or on the live site with ?preview=proof — and then always
 * tagged PLACEHOLDER. In production the whole proof sequence stays off until
 * at least one real entry (isPlaceholder: false) exists.
 *
 * To add a real one: copy an entry, write the person's actual words (with
 * their permission), set isPlaceholder: false, and note where it came from
 * in `source` (e.g. "LinkedIn recommendation", "email, 2026-03").
 */
export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  year: string;
  source: string;
  isPlaceholder: boolean;
};

const PH = (n: number, quote: string, role: string): Testimonial => ({
  id: String(n).padStart(3, "0"),
  quote,
  name: "Placeholder Name",
  role,
  company: "Placeholder Company",
  year: "2026",
  source: "placeholder",
  isPlaceholder: true,
});

export const TESTIMONIALS: Testimonial[] = [
  PH(1, "Placeholder — a short statement from a client about the result of working together.", "Client"),
  PH(2, "Placeholder — a collaborator on how a project was approached, from first question to delivery.", "Collaborator"),
  PH(3, "Placeholder — one line on communication.", "Project lead"),
  PH(4, "Placeholder — a teacher or supervisor on the quality of the analysis and the way a problem was broken down.", "Supervisor"),
  PH(5, "Placeholder — a brief note on reliability and pace.", "Client"),
  PH(6, "Placeholder — a teammate on design and development meeting in one person, and what that changed for the project.", "Teammate"),
  PH(7, "Placeholder — a statement about a delivered interface.", "Product owner"),
  PH(8, "Placeholder — a longer recommendation, the kind found on LinkedIn, describing a specific project, the role taken in it, and the outcome it led to.", "Manager"),
  PH(9, "Placeholder — a short line on attention to detail.", "Collaborator"),
];
