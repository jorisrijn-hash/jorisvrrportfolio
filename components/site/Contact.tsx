import { CONTACT, LINKS } from "@/content/portfolio";

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M1 6.5h10M7 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export function Contact() {
  return (
    <section className="section contact" id="contact">
      <div className="wrap head">
        <div className="head__top" data-reveal>
          <span className="m">{CONTACT.label}</span>
          <span className="rule" />
        </div>
        <h2 className="d" data-reveal>
          {CONTACT.heading.map((line) => (
            <span key={line} className="mask"><span>{line}</span></span>
          ))}
        </h2>
        <p className="contact__body" data-reveal>{CONTACT.body}</p>
        <p data-reveal style={{ ["--delay" as string]: "80ms" }}>
          <a className="action" href={CONTACT.cta.href}>{CONTACT.cta.label}<Arrow /></a>
        </p>
        <ul className="contact__links" data-reveal style={{ ["--delay" as string]: "160ms" }}>
          {LINKS.map((l) => (
            <li key={l.label}>
              <a href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}>
                <span className="m">{l.label}</span>
                <span>{l.value}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
