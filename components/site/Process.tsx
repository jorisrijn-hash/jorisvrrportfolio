import { PROCESS } from "@/content/portfolio";

/** How the work actually goes — four words, not a corporate diagram. */
export function Process() {
  return (
    <section className="section process">
      <div className="wrap head">
        <div className="head__top" data-reveal>
          <span className="m">{PROCESS.label}</span>
          <span className="rule" />
        </div>
        <h2 className="d" data-reveal>
          {PROCESS.heading.map((line) => (
            <span key={line} className="mask"><span>{line}</span></span>
          ))}
        </h2>

        <ol className="process__steps">
          {PROCESS.steps.map((s, i) => (
            <li key={s.n} className="process__step" data-reveal style={{ ["--delay" as string]: `${i * 110}ms` }}>
              <span className="m">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
