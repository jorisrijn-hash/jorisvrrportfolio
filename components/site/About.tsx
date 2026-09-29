import { ABOUT } from "@/content/portfolio";
import { LetterSwap } from "./LetterSwap";

/**
 * ABOUT — one scene.
 *
 * The word, the sentence it is there to say, the two paragraphs behind that
 * sentence and what he works with: all of it in a single screen, placed
 * rather than stacked. The word holds the left, the claim answers it from the
 * right, the detail sits under the claim as a quieter voice, and the
 * technologies run edge to edge along the floor of the composition.
 */
export function About() {
  return (
    <section className="screen about" id="about">
      <p className="m about__label" data-reveal>{ABOUT.label}</p>

      <h2 className="d about__word" data-reveal data-track>
        <LetterSwap text={ABOUT.heading} />
      </h2>

      <div className="about__say">
        <p className="about__lead" data-reveal style={{ ["--delay" as string]: "90ms" }}>{ABOUT.lead}</p>
        <div className="about__body" data-track>
          {ABOUT.body.map((p, i) => (
            <p key={i} data-reveal style={{ ["--delay" as string]: `${180 + i * 90}ms` }}>{p}</p>
          ))}
        </div>
      </div>

      <ul className="stack" data-reveal aria-label="What I work with">
        {ABOUT.stack.map((s) => <li key={s}>{s}</li>)}
      </ul>
    </section>
  );
}
