import { STATEMENT } from "@/content/portfolio";

/** The turn: from what I have built to why I build it that way. */
export function Statement() {
  return (
    <section className="section statement">
      <div className="wrap">
        {/* The second sentence opens grey and lands dark, so the page reads
            the turn rather than being told about it. */}
        {STATEMENT.lines.map((block, b) => (
          <p key={b} className="d" data-reveal style={{ ["--delay" as string]: `${b * 120}ms` }}>
            {block.map((line, i) => (
              <span key={line} className="mask">
                <span className={b === 1 && i === 0 ? "statement__b" : undefined}>{line}</span>
              </span>
            ))}
          </p>
        ))}
        <p className="statement__body" data-reveal>{STATEMENT.body}</p>
      </div>
    </section>
  );
}
