import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Scroll } from "@/components/site/Scroll";
import { Crosshair } from "@/components/site/Crosshair";
import { Weight } from "@/components/site/Weight";
import { Footer } from "@/components/site/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import { Fields } from "@/components/contact/Fields";
import { ScrollCue } from "@/components/contact/ScrollCue";
import { REACH } from "@/content/contact";
import { SITE } from "@/content/site";
import "@/components/contact/contact.css";

export const metadata: Metadata = {
  title: "Get in touch",
  description:
    "Write to Joris van Rijn about a software project, an automation, a digital product, a collaboration or a role. Direct email, phone, LinkedIn and Instagram.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    title: "Get in touch · Joris van Rijn",
    description:
      "Something you want built, an automation that would save time, or a conversation that might go somewhere.",
    url: "/contact",
    siteName: "Joris van Rijn",
    locale: "en_US",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Joris van Rijn, portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get in touch · Joris van Rijn",
    description: "Something you want built, an automation that would save time, or a conversation that might go somewhere.",
    images: ["/og-image.jpg"],
  },
};

/**
 * /contact — the same site, one room further in.
 *
 * Three compositions and then the close. The first two are on paper; the
 * third, where the message is actually written, is inside `.descent` and so
 * is carried into the dark by exactly the machinery the index uses, through
 * the same empty stretch. It is not a second website with a dark form on it:
 * it is this one, later.
 */
export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="reach">
        {/* 01 — the question, and why anyone would ask it */}
        <section className="screen reach__open">
          <p className="m reach__label">{REACH.label}</p>
          <h1 className="d reach__h">
            {REACH.heading.map((l) => (
              <span key={l} className="mask" data-reveal>
                <span>{l}</span>
              </span>
            ))}
          </h1>
          <p className="reach__lead" data-reveal style={{ ["--delay" as string]: "180ms" }}>
            {REACH.lead}
          </p>
        </section>

        {/* 02 — what to write about, and what happens to it. One scene: the
            two halves of the same answer. */}
        <section className="screen reach__work">
          <h2 className="m reach__label" data-reveal>{REACH.fields.label}</h2>
          <Fields />

          <div className="reach__expect" data-reveal>
            <h2 className="m reach__label">{REACH.expect.label}</h2>
            <ol className="reach__steps">
              {REACH.expect.steps.map((s, i) => (
                <li key={s} style={{ ["--delay" as string]: `${i * 110}ms` }}>
                  <span className="m reach__step-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="reach__step-t">{s}</span>
                </li>
              ))}
            </ol>
            <p className="reach__note">{REACH.expect.note}</p>
          </div>
        </section>

        <div className="descent">
          {/* the page turns here, exactly as it does on the index */}
          <div className="fall" data-fall aria-hidden="true" />

          {/* 03 — the message, and every other way to reach me, in one frame */}
          <section className="screen reach__say" id="write">
            <div className="reach__body">
              <div className="reach__direct" data-reveal>
                <h2 className="m reach__label">{REACH.direct.label}</h2>
                <ul className="reach__channels">
                  {REACH.direct.items.map((c) => (
                    <li key={c.label}>
                      <a
                        href={c.href}
                        data-cursor="link"
                        {...(c.href.startsWith("http")
                          ? { target: "_blank", rel: "noreferrer noopener" }
                          : {})}
                      >
                        <span className="m">{c.label}</span>
                        <span className="reach__channel-v">{c.value}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="m reach__from">{SITE.location}</p>
              </div>

              <div className="reach__sheet" data-reveal style={{ ["--delay" as string]: "90ms" }}>
                <h2 className="m reach__label">{REACH.form.label}</h2>
                <ContactForm />
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </main>
      <ScrollCue />
      <Scroll />
      <Crosshair />
      <Weight />
    </>
  );
}
