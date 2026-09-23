"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { hasCaseStudy, type Project } from "@/content/projects";
import { stillSet } from "@/content/work";
import { useSound } from "@/lib/sound";

/**
 * THE NEXT PROJECT — the end of a case study is a way into another one.
 *
 * Not a footer button: it takes the screen, the next project's surface stands
 * in the same 3D space the environment uses, and approaching it brings it
 * closer. If there is no case study behind it yet, it says so and returns to
 * the Work environment instead of claiming a page that does not exist.
 */
export function NextProject({ project: p, onOpen }: { project: Project; onOpen?: (slug: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const { cue } = useSound();
  const ready = hasCaseStudy(p);
  const src = stillSet(p.heroMedia ?? p.showcaseMedia, "(max-width: 900px) 100vw, min(42vw, 420px)");

  // The surface leans towards the pointer — the same camera the environment
  // uses, written to two variables so nothing re-renders.
  const track = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5).toFixed(3)));
    el.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5).toFixed(3)));
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
  };

  const body = (
    <>
      <p className="next__system">{ready ? "Next case study" : "Next project"}</p>
      <div className="next__identity">
        <span className="next__n">{p.number}</span>
        <span className="next__title">{p.title}</span>
      </div>
      <p className="next__type">{p.role?.length ? p.role.join(" / ") : p.type}</p>
      <p className="next__go">
        {ready ? "Open" : "In preparation — back to the index"}
        <ArrowRight size={13} strokeWidth={1.6} aria-hidden="true" />
      </p>
      {src ? (
        <span className="next__media" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src.src} srcSet={src.srcSet} sizes={src.sizes} alt="" decoding="async" draggable={false} />
        </span>
      ) : null}
    </>
  );

  const shared = {
    className: "next__link",
    "data-cursor": "view" as const,
    onPointerMove: track,
    onPointerLeave: reset,
    onPointerEnter: (e: React.PointerEvent) => { if (e.pointerType === "mouse") cue("hover"); },
  };

  return (
    <section ref={ref} className="next" data-ready={ready || undefined}>
      {ready && onOpen ? (
        <button type="button" {...shared} onClick={() => { cue("select"); onOpen(p.slug); }}>{body}</button>
      ) : (
        <a {...shared} href={ready ? `/work/${p.slug}` : "/"} onClick={() => cue("select")}>{body}</a>
      )}
    </section>
  );
}
