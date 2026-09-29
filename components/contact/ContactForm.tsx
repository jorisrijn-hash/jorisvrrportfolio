"use client";

import { useRef, useState } from "react";
import { REACH } from "@/content/contact";
import { SITE } from "@/content/site";

const F = REACH.form;

type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M1 6.5h10M7 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

/**
 * THE FORM.
 *
 * It is the function of the page, so it is built as a form and not as an
 * interface: real labels, real input types, real validation, and a keyboard
 * path through all of it. Nothing here is communicated by hover or by
 * movement alone.
 *
 * WHERE THE MESSAGE GOES. There is no server behind this site and no mail
 * service configured for it, so the form does the one honest thing available
 * to it: it composes the message and hands it to the visitor's own mail
 * client, addressed to the same address printed underneath. It does not
 * claim to have sent anything, because it has not — the visitor still has to
 * press send, and the closing state says so. If an endpoint is ever added,
 * `deliver` is the only function that changes.
 */
export function ContactForm() {
  const form = useRef<HTMLFormElement>(null);
  const [looking, setLooking] = useState<(typeof F.options)[number]>(F.options[0]);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const check = (data: FormData): Errors => {
    const e: Errors = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name) e.name = F.errors.name;
    // Deliberately loose: an address either has a name, an @ and a dot after
    // it or it does not, and anything stricter rejects real addresses.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = F.errors.email;
    if (!message) e.message = F.errors.message;
    return e;
  };

  const deliver = (data: FormData) => {
    const org = String(data.get("org") ?? "").trim();
    const body = [
      String(data.get("message") ?? "").trim(),
      "",
      "--",
      `From: ${String(data.get("name") ?? "").trim()}`,
      org ? `Company or project: ${org}` : "",
      `About: ${looking}`,
      `Reply to: ${String(data.get("email") ?? "").trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
    // Handed over as a link rather than by assigning to location: a mailto
    // set on location inside an event handler is unreliable in Safari, and a
    // link is what this actually is.
    const a = document.createElement("a");
    a.href = `mailto:${SITE.email}?subject=${encodeURIComponent(looking)}&body=${encodeURIComponent(body)}`;
    a.style.display = "none";
    document.body.append(a);
    a.click();
    a.remove();
  };

  const submit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    const e = check(data);
    setErrors(e);
    const first = (["name", "email", "message"] as Field[]).find((k) => e[k]);
    if (first) {
      // an error is no use to somebody who cannot see where it happened
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    deliver(data);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="reach__done" role="status">
        <p className="d reach__done-h">{F.sent.heading}</p>
        <p className="reach__done-b">{F.sent.body}</p>
        <p>
          <button type="button" className="action" onClick={() => { setSent(false); setErrors({}); }}>
            {F.sent.again}
            <Arrow />
          </button>
        </p>
      </div>
    );
  }

  return (
    <form ref={form} className="reach__form" onSubmit={submit} noValidate>
      <Line id="name" label={F.fields.name.label} error={errors.name} autoComplete="name" />
      <Line id="email" label={F.fields.email.label} error={errors.email} type="email" autoComplete="email" />
      <Line id="org" label={F.fields.org.label} placeholder={F.fields.org.placeholder} autoComplete="organization" />

      {/* Six reasons, as six words. A radio group is the honest element for
          this: one answer, arrow keys, and it reads as a sentence rather than
          as a control. */}
      <fieldset className="field field--pick">
        <legend className="m field__label">{F.fields.looking.label}</legend>
        <div className="reach__pick">
          {F.options.map((o) => (
            <label key={o} className="reach__opt" data-on={looking === o || undefined}>
              <input
                type="radio"
                name="looking"
                value={o}
                checked={looking === o}
                onChange={() => setLooking(o)}
                className="sr-only"
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field field--message">
        <label className="m field__label" htmlFor="message">{F.fields.message.label}</label>
        <textarea
          id="message"
          name="message"
          rows={7}
          placeholder={F.fields.message.placeholder}
          required
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "message-error" : undefined}
          data-cursor="text"
        />
        <Error id="message-error" text={errors.message} />
      </div>

      <div className="reach__send">
        <button type="submit" className="action">
          {F.send}
          <Arrow />
        </button>
      </div>
    </form>
  );
}

/** A label, a rule, and what is written on it. */
function Line({
  id,
  label,
  error,
  type = "text",
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="field">
      <label className="m field__label" htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder || undefined}
        autoComplete={autoComplete}
        required={id !== "org"}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        data-cursor="text"
      />
      <Error id={`${id}-error`} text={error} />
    </div>
  );
}

/** Said, not merely coloured: the message is the error, and it is announced. */
function Error({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return <p className="field__error m" id={id} role="alert">{text}</p>;
}
