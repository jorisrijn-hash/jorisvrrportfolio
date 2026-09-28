import { FEATURED, WORK_INTRO } from "@/content/portfolio";

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M1 6.5h10M7 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

/**
 * SELECTED WORK — two projects, each given the whole width.
 *
 * Not a grid of cards: a project is a title the size of the page, one image,
 * and the few facts that are true about it. BEBO has no case study, so it
 * offers the client's live site instead of implying a page that does not
 * exist.
 */
export function Work() {
  return (
    <section className="section" id="work">
      <div className="wrap workintro" data-reveal>
        <h2 className="d mask"><span>{WORK_INTRO.heading}</span></h2>
        <p className="m">{WORK_INTRO.note}</p>
      </div>

      {FEATURED.map((p) => (
        <article key={p.slug} className="wrap project">
          <div className="project__top" data-reveal>
            <span className="m">{p.number} · {p.kind}</span>
            <span className="m">{p.year}</span>
          </div>
          <span className="rule" data-reveal />

          <h3 className="d" data-reveal>
            {p.title.map((line) => (
              <span key={line} className="mask"><span>{line}</span></span>
            ))}
          </h3>

          <div className="project__body">
            <figure className="project__figure" data-reveal>
              {/* Pre-encoded WebP at two widths (scripts/encode-media.py), so
                  there is nothing for an image optimizer to do at runtime. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${p.media.src}-1680.webp`}
                srcSet={`${p.media.src}-960.webp 960w, ${p.media.src}-1680.webp 1680w`}
                sizes="(max-width: 900px) 100vw, 55vw"
                alt={p.media.alt}
                width={1680}
                height={1074}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="m">{p.media.caption}</figcaption>
            </figure>

            <div className="project__side">
              <p className="project__summary" data-reveal>{p.summary}</p>
              <dl className="project__meta" data-reveal style={{ ["--delay" as string]: "80ms" }}>
                {p.meta.map((m) => (
                  <div key={m.label}>
                    <dt className="m">{m.label}</dt>
                    <dd>{m.value}</dd>
                  </div>
                ))}
              </dl>
              <p data-reveal style={{ ["--delay" as string]: "160ms" }}>
                <a
                  className="action"
                  href={p.action.href}
                  {...(p.action.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                >
                  {p.action.label}
                  <Arrow />
                </a>
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
