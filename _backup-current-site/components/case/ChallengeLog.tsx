"use client";

import type { Challenge } from "@/content/projects";

/**
 * THE DEV LOG — what went wrong, and what it taught.
 *
 * Written as entries in a log rather than a success story: the approach that
 * failed keeps its own line, marked, because that is the part worth reading.
 * Every field but the problem is optional.
 */
export function ChallengeLog({ items }: { items: Challenge[] }) {
  return (
    <ol className="log" aria-label="Development log">
      {items.map((c, i) => (
        <li key={c.title} className="log__entry" style={{ ["--i" as string]: i }}>
          <p className="log__stamp">{`// DEV LOG · ${String(i + 1).padStart(2, "0")}`}</p>
          <h3 className="log__title">{c.title}</h3>
          <dl className="log__rows">
            <div><dt>Problem</dt><dd>{c.problem}</dd></div>
            {c.approach ? <div><dt>Approach</dt><dd>{c.approach}</dd></div> : null}
            {c.wrong ? <div data-wrong><dt>What went wrong</dt><dd>{c.wrong}</dd></div> : null}
            {c.solution ? <div><dt>Solution</dt><dd>{c.solution}</dd></div> : null}
            {c.learned ? <div data-learned><dt>Learned</dt><dd>{c.learned}</dd></div> : null}
          </dl>
        </li>
      ))}
    </ol>
  );
}
