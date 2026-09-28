import { HERO_LINES, IDENTITY } from "@/content/portfolio";
import { HeroPortrait } from "./HeroPortrait";

/**
 * HERO — the typography is the environment.
 *
 * Five statements divide the whole height of the screen between them and run
 * past both edges, in alternating directions at different speeds. Nothing is
 * centred in a container and nothing sits "inside" the hero: the words are
 * the hero, the portrait interrupts them, and the four corners are as small
 * as they can be and still be read.
 *
 * Each line is a track holding its phrase twice and travelling exactly half
 * its own width, so the loop closes on itself. No JavaScript is involved.
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
            style={{ ["--dur" as string]: `${38 + i * 9}s` }}
          >
            <div className="mq__track">
              <span>{`${line.text} · `.repeat(5)}</span>
              <span>{`${line.text} · `.repeat(5)}</span>
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
        <p className="m">{IDENTITY.location} · Software engineering</p>
        <p className="m hero__status">
          <span className="dot" aria-hidden="true" />
          {IDENTITY.status}
        </p>
      </div>
    </section>
  );
}
