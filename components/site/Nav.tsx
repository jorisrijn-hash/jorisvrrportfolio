import { IDENTITY, NAV } from "@/content/portfolio";

/**
 * The whole interface: a stacked wordmark and three words. It blends against
 * whatever is under it, so the same element reads on paper and on black.
 */
export function Nav() {
  return (
    <header className="nav">
      <a className="nav__mark" href="#top" aria-label={`${IDENTITY.name} — back to top`}>
        <span>{IDENTITY.first}</span>
        <span>{IDENTITY.last}</span>
      </a>
      <nav className="nav__links" aria-label="Sections">
        {NAV.map((n) => (
          <a key={n.href} href={n.href}>{n.label}</a>
        ))}
      </nav>
    </header>
  );
}
