"use client";

import { useRouter } from "next/navigation";
import { PROJECT_BY_SLUG } from "@/content/projects";
import { CustomCursor } from "@/components/cursor/CustomCursor";
import { CaseStudy } from "./CaseStudy";

/**
 * A case study reached by its own URL.
 *
 * There is no environment behind it to hand the surface over, so the hero
 * arrives by itself and shortened, and "Work" is a real navigation rather
 * than a state change. The cursor comes along, because this is still the
 * same site; the analog layer belongs to the environment and stays there.
 */
export function CaseRoute({ slug }: { slug: string }) {
  const router = useRouter();
  const project = PROJECT_BY_SLUG[slug];
  if (!project) return null;

  return (
    <div className="case-route">
      <CaseStudy
        project={project}
        arrival="direct"
        onOpen={(next) => router.push(`/work/${next}`)}
      />
      <CustomCursor />
    </div>
  );
}
