import { FOOTER, IDENTITY } from "@/content/portfolio";

/**
 * The closing frame. One screen: the line, who said it, and the two small
 * facts that belong at the end of a site. The channels are not repeated here,
 * because they are already in the composition above this one.
 */
export function Footer() {
  return (
    <footer className="footer">
      <h2 className="footer__lines">
        {FOOTER.lines.map((line, i) => (
          <span key={line} className="d mask" data-reveal style={{ ["--delay" as string]: `${i * 90}ms` }}>
            <span>{line}</span>
          </span>
        ))}
      </h2>

      <div className="footer__foot" data-reveal>
        <span className="m">{IDENTITY.name}</span>
        <span className="m">{IDENTITY.discipline}</span>
        <span className="m">© {FOOTER.year}</span>
        <span className="m hero__status">
          <span className="dot" aria-hidden="true" />
          {IDENTITY.status}
        </span>
      </div>
    </footer>
  );
}
