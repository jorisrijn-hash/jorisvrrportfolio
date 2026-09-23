"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Project } from "@/content/projects";
import { PROJECTS, hasCaseStudy } from "@/content/projects";
import { useReducedMotion } from "@/lib/motion";
import { useSound } from "@/lib/sound";
import { CaseHero } from "./CaseHero";
import { ArchitectureDiagram, DataDiagram } from "./Diagrams";
import { Decisions } from "./Decisions";
import { CodeBlock } from "./CodeBlock";
import { ChallengeLog } from "./ChallengeLog";
import { ProjectResult } from "./Result";
import { NextProject } from "./NextProject";
import "./case.css";

/**
 * A CASE STUDY — one project, read as engineering.
 *
 * Nothing here is a template with holes in it. Every section is built from
 * what content/projects.ts actually holds for this project: a section with no
 * data is not rendered, its heading does not exist, and the index down the
 * side is generated from the sections that survived — so two case studies can
 * be completely different shapes without either looking unfinished.
 *
 * The visitor can arrive two ways, and the difference is only in time:
 *   "carried"  from the Work environment, whose surface became the hero
 *   "direct"   from a URL, so the hero arrives by itself, shortened
 */
export function CaseStudy({
  project,
  arrival = "direct",
  onBack,
  onOpen,
}: {
  project: Project;
  arrival?: "carried" | "direct";
  /** back to the Work environment, when there is one behind this */
  onBack?: () => void;
  /** open another case study from the end of this one */
  onOpen?: (slug: string) => void;
}) {
  const p = project;
  const reduced = useReducedMotion();
  const { cue } = useSound();
  const root = useRef<HTMLElement>(null);

  // ---- the sections this project actually has ------------------------------
  const sections = useMemo(() => {
    const out: { id: string; label: string; node: ReactNode }[] = [];
    const add = (id: string, label: string, node: ReactNode) => out.push({ id, label, node });

    if (p.context?.length) {
      add("context", "Context", (
        <div className="case-prose">
          {p.context.map((line, i) => <p key={i}>{line}</p>)}
        </div>
      ));
    }
    if (p.problems?.length) {
      add("problem", "The problem", (
        <ol className="case-problems">
          {p.problems.map((q, i) => (
            <li key={q.title}>
              <span className="case-problems__n">{String(i + 1).padStart(2, "0")}</span>
              <h3>{q.title}</h3>
              <p>{q.body}</p>
            </li>
          ))}
        </ol>
      ));
    }
    if (p.requirements?.functional?.length || p.requirements?.nonFunctional?.length) {
      add("requirements", "Requirements", (
        <div className="case-reqs">
          {p.requirements.functional?.length ? (
            <div>
              <p className="case-reqs__label">{"// Functional"}</p>
              <ul>{p.requirements.functional.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          ) : null}
          {p.requirements.nonFunctional?.length ? (
            <div>
              <p className="case-reqs__label">{"// Constraints"}</p>
              <ul>{p.requirements.nonFunctional.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          ) : null}
        </div>
      ));
    }
    if (p.architecture) add("architecture", "Architecture", <ArchitectureDiagram model={p.architecture} />);
    if (p.database) add("data", "Data model", <DataDiagram model={p.database} />);
    if (p.engineeringDecisions?.length) {
      add("decisions", "Engineering decisions", <Decisions items={p.engineeringDecisions} />);
    }
    if (p.codeExamples?.length) {
      add("code", "Implementation", (
        <div className="case-code">
          {p.codeExamples.map((ex) => <CodeBlock key={ex.filename + ex.code.length} example={ex} />)}
        </div>
      ));
    }
    if (p.product?.body?.length || p.product?.media?.length) {
      add("product", "The product", (
        <div className="case-prose">
          {p.product.body?.map((line, i) => <p key={i}>{line}</p>)}
          {p.product.media?.map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={m.src} className="case-shot" src={m.src} alt={m.alt} width={m.width} height={m.height} loading="lazy" decoding="async" />
          ))}
        </div>
      ));
    }
    if (p.challenges?.length) add("challenges", "Challenges", <ChallengeLog items={p.challenges} />);
    if (p.result) add("result", "Result", <ProjectResult result={p.result} />);
    return out;
  }, [p]);

  // ---- which section is being read ----------------------------------------
  const [here, setHere] = useState(sections[0]?.id ?? "");
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const marks = [...el.querySelectorAll<HTMLElement>("[data-section]")];
    if (!marks.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.setAttribute("data-in", "");
        });
        // the topmost section still on screen is the one being read
        const seen = marks.filter((m) => {
          const r = m.getBoundingClientRect();
          return r.top < window.innerHeight * 0.45 && r.bottom > 0;
        });
        const last = seen[seen.length - 1];
        if (last) setHere(last.dataset.section ?? "");
      },
      { rootMargin: "-10% 0px -35% 0px", threshold: [0, 0.01, 0.2] },
    );
    marks.forEach((m) => io.observe(m));
    return () => io.disconnect();
  }, [sections]);

  // Reduced motion: everything is simply there.
  useEffect(() => {
    if (!reduced) return;
    root.current?.querySelectorAll("[data-section]").forEach((m) => m.setAttribute("data-in", ""));
  }, [reduced]);

  /**
   * Jumping to a section.
   *
   * The sections below the fold are not laid out until they are reached
   * (content-visibility), which means their offsets are estimates — and an
   * anchor would land in the wrong place. One deliberate jump is worth one
   * real layout pass: everything is laid out for the length of the scroll,
   * and `contain-intrinsic-size: auto` keeps the measured sizes afterwards,
   * so every later jump is already exact.
   */
  const jump = (id: string) => (e: React.MouseEvent) => {
    const scroller = root.current;
    const target = document.getElementById(id);
    if (!scroller || !target) return;
    e.preventDefault();
    cue("select");
    scroller.setAttribute("data-jump", "");
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => scroller.removeAttribute("data-jump"), reduced ? 60 : 900);
    try { window.history.replaceState(null, "", `#${id}`); } catch {}
  };

  const next = useMemo(() => {
    const i = PROJECTS.findIndex((x) => x.slug === p.slug);
    const after = [...PROJECTS.slice(i + 1), ...PROJECTS.slice(0, i)];
    return after.find((x) => hasCaseStudy(x)) ?? after.find((x) => !x.comingSoon) ?? null;
  }, [p.slug]);

  return (
    <article ref={root} className="case" data-arrival={arrival} data-reduced={reduced || undefined}>
      {/* Development material says what it is, on the page, every time. It
          cannot reach production — content/projects.ts folds it away in a
          production build — but in development it must never read as
          finished work. */}
      {p.devOnly ? (
        <p className="case-dev" role="status">
          <span>{"// DEV PLACEHOLDER"}</span>
          Development case study — built from this repository to exercise the sections. Not published.
        </p>
      ) : null}

      <CaseHero project={p} arrival={arrival} onBack={onBack} />

      {sections.length > 1 ? (
        <nav className="case-nav" aria-label="Sections">
          <ol>
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  data-current={s.id === here || undefined}
                  onClick={jump(s.id)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="case-body">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="case-section" data-section={s.id}>
            <header className="case-section__head">
              <span className="case-section__n">{String(i + 1).padStart(2, "0")}</span>
              <h2>{s.label}</h2>
              <span className="case-section__rule" aria-hidden="true" />
            </header>
            {s.node}
          </section>
        ))}
      </div>

      {next ? <NextProject project={next} onOpen={onOpen} /> : null}
    </article>
  );
}
