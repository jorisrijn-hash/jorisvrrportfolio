import { CONTACT, LINKS } from "@/content/portfolio";
import { Decrypt } from "./Decrypt";

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M1 6.5h10M7 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

/**
 * CONTACT — one screen, not two.
 *
 * The question, what is behind it, the way in, and every channel: all in the
 * same frame. The question resolves out of noise as it is reached, which is
 * the only place on the site that happens, because it is the one line the
 * page actually wants an answer to.
 */
export function Contact() {
  return (
    <section className="screen contact" id="contact">
      <p className="m contact__label" data-reveal>{CONTACT.label}</p>

      <h2 className="d contact__q" data-reveal>
        {CONTACT.heading.map((line, i) => (
          <span key={line} className="mask">
            <Decrypt text={line} className={i === 1 ? "contact__q2" : undefined} />
          </span>
        ))}
      </h2>

      <div className="contact__answer">
        <p className="contact__body" data-reveal>{CONTACT.body}</p>
        <p data-reveal style={{ ["--delay" as string]: "90ms" }}>
          <a className="action" href={CONTACT.cta.href} data-cursor="link">{CONTACT.cta.label}<Arrow /></a>
        </p>
      </div>

      <ul className="contact__links" data-reveal>
        {LINKS.map((l) => (
          <li key={l.label}>
            <a href={l.href} data-cursor="link" {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}>
              <span className="m">{l.label}</span>
              <span>{l.value}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
