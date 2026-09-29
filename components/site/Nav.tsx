"use client";

import { usePathname } from "next/navigation";
import { IDENTITY, NAV } from "@/content/portfolio";

/**
 * The whole interface: a stacked wordmark and three words. It blends against
 * whatever is under it, so the same element reads on paper and on black.
 *
 * A link does not jump. It asks the page to travel there, through the same
 * weighted scroll everything else moves with (components/site/Weight), and
 * updates the address so the position can be linked to and gone back to.
 *
 * Off the index there is nothing to travel to, so the same three words become
 * ordinary links back to it and the wordmark goes home. That is the whole of
 * the way back from /contact: the navigation IS the back button, rather than
 * a second one appearing beside it.
 */
export function Nav() {
  const home = usePathname() === "/";

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!home) return;                        // a real navigation, not a scroll
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const id = href.slice(1);
    const target = id === "top" ? document.body : document.getElementById(id);
    if (!target) return;                      // no section, no interception
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("site:goto", { detail: { id } }));
    history.replaceState(null, "", id === "top" ? location.pathname : href);
  };

  return (
    <header className="nav">
      <a
        className="nav__mark"
        href={home ? "#top" : "/"}
        onClick={(e) => go(e, "#top")}
        aria-label={home ? `${IDENTITY.name}, back to the top` : `${IDENTITY.name}, back to the index`}
      >
        <span>{IDENTITY.first}</span>
        <span>{IDENTITY.last}</span>
      </a>
      <nav className="nav__links" aria-label="Sections">
        {NAV.map((n) => (
          <a key={n.href} href={home ? n.href : `/${n.href}`} onClick={(e) => go(e, n.href)}>{n.label}</a>
        ))}
      </nav>
    </header>
  );
}
