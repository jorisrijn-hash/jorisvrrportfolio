"use client";

import type { CodeExample } from "@/content/projects";

/**
 * CODE — as a document, not a screenshot of an editor.
 *
 * No window chrome, no traffic lights, no fake tab bar: the filename is a
 * label, the lines are numbered because they are referred to, and marked
 * lines carry the mark. The code is quoted verbatim from the file named.
 */
export function CodeBlock({ example }: { example: CodeExample }) {
  const lines = example.code.replace(/\s+$/, "").split("\n");
  const marked = new Set(example.highlight ?? []);

  return (
    <figure className="code">
      <figcaption className="code__head">
        <span className="code__file">{example.filename}</span>
        <span className="code__lang">{example.language}</span>
      </figcaption>
      <pre className="code__body" tabIndex={0}>
        <code>
          {lines.map((line, i) => (
            <span key={i} className="code__line" data-mark={marked.has(i + 1) || undefined}>
              <span className="code__no" aria-hidden="true">{String(i + 1).padStart(2, " ")}</span>
              <span className="code__text">{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
      {example.note ? <p className="code__note">{example.note}</p> : null}
    </figure>
  );
}
