import { ABOUT } from "@/content/portfolio";

/** After the hero, the page goes quiet. That contrast is the point. */
export function About() {
  return (
    <section className="section" id="about">
      <div className="wrap head">
        <div className="head__top" data-reveal>
          <span className="m">{ABOUT.label}</span>
          <span className="rule" />
        </div>
        <h2 className="d mask" data-reveal><span>{ABOUT.heading}</span></h2>

        <div className="about__grid">
          <p className="about__lead" data-reveal>{ABOUT.lead}</p>
          <div className="about__body">
            {ABOUT.body.map((p, i) => (
              <p key={i} data-reveal style={{ ["--delay" as string]: `${i * 90}ms` }}>{p}</p>
            ))}
          </div>
        </div>

        {/* metadata, not a résumé: no bars, no years, no percentages */}
        <ul className="stack" data-reveal aria-label="What I work with">
          {ABOUT.stack.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </div>
    </section>
  );
}
