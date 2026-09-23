"use client";

import type { Project } from "@/content/projects";
import { stillSet } from "@/content/work";

/**
 * THE RESULT — what it does now, and what was measured.
 *
 * A metric may not exist without the thing that measured it: every number
 * carries its source, and a project with nothing measured shows no numbers
 * rather than rounded ones.
 */
export function ProjectResult({ result }: { result: NonNullable<Project["result"]> }) {
  return (
    <div className="result">
      {result.body?.length ? (
        <div className="case-prose">
          {result.body.map((line, i) => <p key={i}>{line}</p>)}
        </div>
      ) : null}

      {result.metrics?.length ? (
        <dl className="result__metrics">
          {result.metrics.map((m, i) => (
            <div key={m.label} style={{ ["--i" as string]: i }}>
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
              <p className="result__source">{`// ${m.source}`}</p>
            </div>
          ))}
        </dl>
      ) : null}

      {result.media?.length ? (
        <div className="result__shots">
          {result.media.map((m) => {
            const src = stillSet(m, "(max-width: 900px) 100vw, min(1100px, 100vw - 120px)");
            if (!src) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={m.src}
                src={src.src}
                srcSet={src.srcSet}
                sizes={src.sizes}
                alt={m.alt}
                width={m.width}
                height={m.height}
                loading="lazy"
                decoding="async"
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
