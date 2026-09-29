import { ABOUT } from "@/content/portfolio";
import { LetterSwap } from "./LetterSwap";

/**
 * ABOUT — three screens, one idea each.
 *
 * The word, alone, at the size of the room. Then the sentence that matters,
 * placed off-centre with nothing else on the screen to argue with it. Then
 * the two paragraphs and the metadata, quiet, as the section lets go.
 */
export function About() {
  return (
    <section id="about">
      <div className="screen about__mark">
        <p className="m about__label" data-reveal>{ABOUT.label}</p>
        <h2 className="d about__word" data-reveal data-track>
          <LetterSwap text={ABOUT.heading} />
        </h2>
      </div>

      <div className="screen about__claim">
        <p className="about__lead" data-reveal>{ABOUT.lead}</p>
      </div>

      <div className="screen about__detail">
        <div className="about__body" data-track>
          {ABOUT.body.map((p, i) => (
            <p key={i} data-reveal style={{ ["--delay" as string]: `${i * 110}ms` }}>{p}</p>
          ))}
        </div>
        <ul className="stack" data-reveal aria-label="What I work with">
          {ABOUT.stack.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </div>
    </section>
  );
}
