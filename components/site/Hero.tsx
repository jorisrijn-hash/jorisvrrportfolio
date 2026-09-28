import { HERO_LINES, IDENTITY } from "@/content/portfolio";
import { HeroPortrait } from "./HeroPortrait";

/**
 * HERO — four statements running across the screen, and one object in the
 * middle of them.
 *
 * Each line is a track holding the phrase twice and sliding exactly half its
 * own width, so the loop closes on itself with no seam and no JavaScript.
 * The lines run in opposite directions at different speeds; the page clips
 * them, so nothing ever scrolls sideways.
 */
export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__lines" aria-hidden="true">
        {HERO_LINES.map((line, i) => (
          <div
            key={line.text}
            className="mq"
            data-dir={line.dir}
            data-depth={i % 2}
            style={{ ["--dur" as string]: `${34 + i * 7}s` }}
          >
            <div className="mq__track">
              {/* two halves, identical: the animation travels exactly one */}
              <span>{`${line.text} · `.repeat(4)}</span>
              <span>{`${line.text} · `.repeat(4)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* what the moving type says, for anything that cannot see it */}
      <h1 className="sr-only">
        {IDENTITY.name} — {IDENTITY.discipline}. Software engineer and full-stack developer.
      </h1>

      <HeroPortrait />

      <div className="hero__corners">
        <p className="m">
          {IDENTITY.location} · Software engineering
        </p>
        <p className="m hero__status">
          <span className="dot" aria-hidden="true" />
          {IDENTITY.status}
        </p>
      </div>
    </section>
  );
}
