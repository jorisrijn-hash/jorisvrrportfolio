import { STATEMENT } from "@/content/portfolio";

/**
 * The turn in the page.
 *
 * Not one giant quote that appears: the two halves are a screen apart, each
 * line drifts sideways at its own rate as the section travels (the `--p` the
 * scroll driver writes), and the second sentence is only reached after the
 * first has gone by. It is read the way it is scrolled.
 */
export function Statement() {
  return (
    <section className="statement" data-track>
      {STATEMENT.lines.map((block, b) => (
        <div key={b} className="statement__half" data-half={b}>
          <p className="d">
            {block.map((line, i) => (
              // the mask carries the reveal, not the span inside it: an
              // element clipped out of its own parent never intersects
              <span key={line} className="mask" data-reveal style={{ ["--i" as string]: i }}>
                <span className={b === 1 && i === 0 ? "statement__b" : undefined}>{line}</span>
              </span>
            ))}
          </p>
        </div>
      ))}
      <p className="statement__body wrap" data-reveal>{STATEMENT.body}</p>
    </section>
  );
}
