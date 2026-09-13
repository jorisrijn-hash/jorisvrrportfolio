# jorisvrr.com

Personal site for Joris van Rijn. Next.js 16 (App Router) · React 19 · TypeScript ·
Tailwind v4 · Motion · Cuelume.

```bash
npm run dev      # local development
npm run build    # production build
npm run verify   # accessibility + behaviour checks (needs the server running)
npm run shots    # screenshot every route, desktop + mobile
```

## The site is one fullscreen experience

`/` is a state machine, not a scrolling page. Every surface is 100vw x 100dvh
with `overflow: hidden`.

    BOOT -> HOME <-> WORK_IN / WORK / WORK_OUT
                 <-> ABOUT_IN / ABOUT / ABOUT_OUT

`lib/experience.tsx` owns it. A transition is a STATE, not a flag, which is
what lets input be locked while one runs — no double navigation, no
overlapping timelines. `/work` and `/about` are deep links into their states.

## Reference assets

`public/reference/` holds Joris's original design files, untouched:
`loadingempty.png`, `loadinganimation.mp4/.mp3`, `mainbackground.mp4`,
`maintofeaturedwork.mp4`, `maintoabout.mp4` — all 1920x950 @ 59.94fps.

`public/media/` holds the web-encoded derivatives. **Never edit those by hand**
— re-encode from `public/reference/`.

Important: the originals are SCREEN RECORDINGS. Each carries a browser
scrollbar (right 15px), a mouse cursor and OS corner icons. The encode crops
16px from each side; the About globe is cropped further to its own 760x760
bounding box so the recording's baked top bar and URL bar are excluded.

## Measured values (do not "tidy" these)

Everything in `app/tokens.css` was measured from the reference, not chosen:

| | |
|---|---|
| ground | `#E8E8E8` |
| grid | 24px cells, verticals at x=0, horizontals at **y=14** (mod 24) |
| grid line | `#DEDEDE`, contrast ~10/255 |
| radial wash | contrast falls 10.7 -> 6.6 at centre; ~0.38 alpha over ~500px |
| centre construction | circle r=119, dashed arc r=153, outer r=179, diamond vertices on the circle |
| work panel | quad NW(224,124) SW(224,657) SE(1002,629) NE(1002,172) |
| about panels | A 554-1351 x 197-413 · B 554-931 x 472-657 · C 974-1351 x 472-739 |

Project titles are set in a **serif**, not 1955 — that is what the reference
does.

## Dev flags

`lib/dev.ts`, compiled out of production. Toggle live in the console:

    __jvr.set("FORCE_INTRO", true)

`FORCE_INTRO` · `SHOW_GRID_DEBUG` · `REDUCE_MEDIA` · `MUTE_SOUND` ·
`SHOW_STATE` · `SKIP_TRANSITIONS`

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

**There is no centred page wrapper.** Layout is full-bleed: a scene owns
100vw and content is placed by COLUMN on a viewport-wide grid (`.vgrid` plus
`.col-*`). Readability comes from column placement, never from `max-width` +
`margin: auto`. Adding a centred container is the one change that would undo
the whole design.

**Scenes are not uniformly spaced.** `<Scene measure>` is chosen per scene on
purpose — identical padding everywhere is what makes a page read as a template.

**`MaskReveal` triggers on its outer element, not the clipped child.** The child
starts translated outside its own `overflow:hidden` parent, so an
IntersectionObserver on it measures zero visible area and the reveal never
fires. Keep the trigger outside the clip.

**Section colour comes from `<Section tone>`**, which flips the semantic token
layer (`--surface`, `--on-surface`, `--rule`, `--accent`). Components should
never name a brand colour directly — that is what makes tone switching and the
inverting cursor work.

**Scroll-driven `useTransform` needs a strictly increasing input range inside
[0, 1].** Motion converts these to WAAPI keyframe offsets; an out-of-range or
duplicated stop throws "Offsets must be monotonically non-decreasing" and takes
down the whole page on hydration, not just the component. Where the range has
pinned or constant edges (the sticky Currently sequence), use the FUNCTION form
of `useTransform` instead — see `components/scenes/Currently.tsx`.

**Never `useSpring` a value with units.** Spring a number, then format it
(`useTransform(v => \`${v}%\`)`). Springing a percentage string produces
invalid keyframes.

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
