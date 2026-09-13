/**
 * PROJECT REGISTRY — data driven (§14).
 *
 * WorkState renders entirely from this array: index, title, body, panel media,
 * thumbnail and the scrub segments all derive from it. Adding a project is one
 * entry; nothing in the component changes.
 *
 * mediaType covers the surfaces the brief asks to support. "image" and "video"
 * render directly; "component" mounts a React renderer by key, which is the
 * hook for canvas/WebGL/SVG pieces later.
 */
export type MediaType = "image" | "video" | "component";

export type Project = {
  id: string;
  slug: string;
  /** Display index, zero-padded. Derived from position if omitted. */
  index?: string;
  title: string;
  year: string;
  discipline: string;
  /** One or two sentences. The reference shows nothing longer here. */
  summary: string;
  mediaType: MediaType;
  mediaSrc: string;
  posterSrc: string;
  /** Key into the component renderer map, when mediaType is "component". */
  componentKey?: string;
  /** Optional per-project accent; the environment is otherwise monochrome. */
  accent?: string;
  soundProfile?: "soft" | "mechanical";
};

export const PROJECTS: Project[] = [
  {
    id: "p01",
    slug: "smoke-diffusion",
    title: "Smoke Diffusion",
    year: "2026",
    discipline: "Procedural / Shader",
    summary:
      "A procedural smoke density function drives RGB channel offsets for a diffused, volumetric read without full 3D simulation.",
    mediaType: "image",
    mediaSrc: "/work/01-smoke-diffusion.jpg",
    posterSrc: "/work/thumb-1.jpg",
    soundProfile: "soft",
  },
  {
    id: "p02",
    slug: "voronoi-field",
    title: "Voronoi Field",
    year: "2026",
    discipline: "Generative / Geometry",
    summary:
      "Voronoi cells relax over a weighted point set, then light per-cell from a moving source to give the flat partition depth.",
    mediaType: "image",
    mediaSrc: "/work/02-voronoi-field.jpg",
    posterSrc: "/work/thumb-2.jpg",
    soundProfile: "mechanical",
  },
];

export const projectIndex = (i: number) => String(i + 1).padStart(2, "0");
export const totalProjects = () => PROJECTS.length;
