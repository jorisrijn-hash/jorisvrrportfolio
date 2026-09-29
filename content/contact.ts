/**
 * THE CONTACT PAGE.
 *
 * Its own file because it is its own route, and because everything here is
 * said once, in one place, the same way the rest of the site keeps its copy.
 *
 * Nothing on this page is invented. The fields are the vocabulary the site
 * already uses for itself (`HERO_LINES`), each carrying the line it already
 * carries in What I Work With (`FOCUS`). The channels are the real ones from
 * `content/site.ts`. There are no clients, no services, no response times and
 * no availability promised anywhere: this is a person's portfolio, not an
 * agency, and the page says only what is true of it.
 */

import { ABOUT as PROFILE, SITE, SOCIALS } from "@/content/site";
import { FOCUS } from "@/content/portfolio";

const line = (id: string) => FOCUS.items.find((f) => f.id === id)!.line;
const phone = PROFILE.meta.find((m) => m.label === "Phone")!;

export const REACH = {
  label: "(04)",
  heading: ["Get in", "touch"],

  /** Said plainly, in the first person, claiming nothing. */
  lead: "Something you want built, a product you are trying to get off the ground, an automation that would save somebody an afternoon a week, or a conversation that might go somewhere. Write it here and it comes straight to me.",

  /** What someone can reasonably write to me about. The site's own words for
   *  the work, with the line each one already has elsewhere. */
  fields: {
    label: "What I can help with",
    items: [
      { id: "software", title: "Software", line: line("software") },
      { id: "automations", title: "Automations", line: line("automations") },
      { id: "fullstack", title: "Full-stack development", line: "The whole of a thing: the interface, the API behind it, and the database under that." },
      { id: "product", title: "Product development", line: line("products") },
      { id: "business", title: "Business × technology", line: line("business") },
    ],
  },

  /** Reassurance, not a process diagram. Three lines, and no promise about
   *  when: I am a student, and I am not going to invent a response time. */
  expect: {
    label: "What to expect",
    steps: ["You send it", "I read it", "We talk"],
    note: "There is no team behind this. Whatever you write arrives with me.",
  },

  form: {
    label: "The message",
    fields: {
      name: { label: "Your name", placeholder: "" },
      email: { label: "Email", placeholder: "" },
      org: { label: "Company or project", placeholder: "Optional" },
      looking: { label: "What are you looking for?" },
      message: { label: "Message", placeholder: "Tell me a little about it." },
    },
    /** The reason for writing, which becomes the subject line. */
    options: [
      "Software / development",
      "Automation",
      "Digital product",
      "Website",
      "Collaboration",
      "Work opportunity",
      "Something else",
    ],
    send: "Send message",
    /** Truthful about what actually happens: the page has no server, so it
     *  hands the message to the visitor's own mail client. Saying "sent"
     *  would be a lie about a thing they can see for themselves. */
    sending: "Opening your mail app",
    sent: {
      heading: "It is ready to send",
      body: "Your mail app should have opened with the message in it. Send it and it reaches me. If nothing opened, the address is right here.",
      again: "Write another",
    },
    errors: {
      name: "I need something to call you.",
      email: "This needs to be an address I can reply to.",
      message: "Tell me a little about it, even one line.",
    },
  },

  direct: {
    label: "Or reach me directly",
    items: [
      { label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
      { label: "Phone", value: phone.value, href: phone.href! },
      { label: "LinkedIn", value: "in/jorisvnrijn", href: SOCIALS.find((s) => s.id === "linkedin")!.href },
      { label: "Instagram", value: "@jorisvrr", href: SOCIALS.find((s) => s.id === "instagram")!.href },
    ],
  },

  /** The one nudge on the page: the form is below the introduction, and
   *  nothing else on screen says so. */
  cue: "Scroll down",

  /** The way back, since this page is off the one page everything else is on. */
  back: "Index",
} as const;
