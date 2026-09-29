import { FOOTER, IDENTITY, LINKS } from "@/content/portfolio";

/**
 * The closing scene. The page has already turned black by the time this is
 * reached (the band above it), so this is not a footer bar — it is the last
 * thing the site says, at the size it deserves.
 */
export function Footer() {
  return (
    <footer className="footer">
        <div className="footer__lines">
          {FOOTER.lines.map((line, i) => (
            <h2 key={line} className="d mask" data-reveal style={{ ["--delay" as string]: `${i * 90}ms` }}>
              <span>{line}</span>
            </h2>
          ))}
        </div>

        <div className="footer__grid" data-reveal>
          <div className="footer__col">
            <span className="m">{IDENTITY.name}</span>
            <span className="m">{IDENTITY.discipline}</span>
          </div>
          {LINKS.map((l) => (
            <div key={l.label} className="footer__col">
              <span className="m">{l.label}</span>
              <a href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}>
                {l.value}
              </a>
            </div>
          ))}
        </div>

      <div className="footer__bottom">
        <span className="m">© {FOOTER.year} {IDENTITY.name}</span>
        <span className="m hero__status">
          <span className="dot" aria-hidden="true" />
          {IDENTITY.status}
        </span>
      </div>
    </footer>
  );
}
