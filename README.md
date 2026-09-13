# jorisvrr.com

Personal site for Joris van Rijn. Next.js 16 (App Router) · React 19 · TypeScript ·
Tailwind v4 · Motion · Cuelume.

```bash
npm run dev      # local development
npm run build    # production build
npm run verify   # accessibility + behaviour checks (needs the server running)
npm run shots    # screenshot every route, desktop + mobile
```

## Where things live

```
app/
  tokens.css        every colour, type, space, motion and z-index token
  globals.css       base styles, focus, utilities, reduced-motion
  chrome.css        intro, header, menu, cursor
  home.css          section modules
  fonts.ts          1955 + Geist Mono loading
lib/
  logo.ts           the mark, as grid geometry
  motion.ts         durations, easings, stagger, variants
  sound.tsx         SoundProvider (opt-in, persisted)
  type.ts           weight roles
content/            site copy, work registry, lab registry  <- edit here
components/
  primitives/       MaskReveal, MotionText, WeightText, Section, LogoMark…
  chrome/           SiteIntro, ChromeHeader, DrapeMenu, CustomCursor
  modules/          homepage sections
```

## Adding content

Publishing work or a Lab entry is a content change, not a code change.

- **A project** — add an entry to `WORK` in `content/work.ts`. `/work`,
  `/work/[slug]`, and the homepage feature slot pick it up automatically. Set
  `featured: true` on at most one.
- **A Lab entry** — add to `LAB` in `content/lab.ts`.
- **Copy** — `content/site.ts`.

Both registries ship empty on purpose. Every surface that lists them already
renders a considered empty state, so the site reads as finished while the
portfolio fills up.

## Things worth knowing before you change them

**1955 has four weights: 100, 300, 500, 900.** No Regular, no Bold. Setting
`font-weight: 400` or `700` makes the browser synthesise a face that is not in
the family. Use the roles in `lib/type.ts`. `font-synthesis-weight: none` is set
globally as a backstop.

**There is no variable axis**, so weight cannot be interpolated. `WeightText`
works around this with two real modes — `cross` (two faces crossfaded) and
`step` (a hard swap). If a variable cut is ever licensed, add a `vf` mode; the
component's props would not change.

**Fonts are not preloaded.** Eight faces is ~350KB to use two. They load on
demand, and the intro sequence covers that first round-trip.

**`MaskReveal` triggers on its outer element, not the clipped child.** The child
starts translated outside its own `overflow:hidden` parent, so an
IntersectionObserver on it measures zero visible area and the reveal never
fires. Keep the trigger outside the clip.

**Section colour comes from `<Section tone>`**, which flips the semantic token
layer (`--surface`, `--on-surface`, `--rule`, `--accent`). Components should
never name a brand colour directly — that is what makes tone switching and the
inverting cursor work.

**Stone is not a text colour on light grounds.** `#949087` is 2.72:1 on ivory,
below AA. `--on-surface-dim` resolves to `--color-stone-deep` there instead.

## Legacy URLs

`next.config.ts` redirects the previous site's Dutch and English routes
(`/werk`, `/prijzen`, `/werkwijze`, `/ai`, `/en/*`) to their nearest equivalent.
The old `/work/:path*` catch-all was deliberately dropped — `/work/[slug]` is a
real route now.

## Fonts

Web-ready `.woff2` files live in `app/fonts/`. The licensed `.otf` originals are
kept in `_fonts-source/`, which is gitignored.
