# jorisvrr.com

Personal site for Joris van Rijn. Next.js 16 (App Router, Turbopack) · React 19 ·
TypeScript · Tailwind v4.

```bash
npm run dev      # local development
npm run build    # production build
npm run start    # serve the production build
npm run lint
```

Deployed on Vercel. **The site serves on `www.jorisvrr.com`**; the apex 308s to
it, which is why `SITE.origin` in `content/site.ts` names the www host. Every
canonical URL, the sitemap and robots read from that one value.

## It is one page

`/` is the whole site: a single document read from a light state into a dark
one. The only other route is `/work/[slug]`, and only for a project that has a
real case study.

    Hero -> About -> Work ----------- .descent ------------
                              fall -> Focus -> Contact -> Footer

Everything is server-rendered. `.descent` is the wrapper that carries the page
from paper to near-black, driven by `.fall` — an empty stretch, on purpose, so
the low-contrast middle of that change lands where there is nothing to read.

## The client layer is four components

There is no framework doing the motion. `components/site/`:

| | |
|---|---|
| `Scroll.tsx` | The page's ONE scroll listener and ONE rAF. Writes `--p` (an element's own progress through the viewport) and `--n` (the page's day-to-night state), and marks `[data-reveal]` once. Everything else reads those custom properties in CSS. |
| `Weight.tsx` | The heavy scroll. Lerps toward a target and drives the real `window.scrollY`, so `position: sticky` and `fixed` keep working. Bows out for reduced motion, coarse pointers and pinch-zoom. |
| `Crosshair.tsx` | The pointer. Hides the native cursor only while it is actually mounted, so a failure can never leave the page with no cursor. |
| `Nav.tsx` | Turns an anchor click into a `site:goto` event that `Weight` animates. |

The rest (`HeroLines`, `HeroPortrait`, `Proximity`, `Decrypt`, `LetterSwap`)
are single effects owned by the one element that needs them.

## Content is not code

Changing what the site says is an edit to `content/`, never to a component.

- `content/portfolio.ts` — everything on the home page: `IDENTITY`,
  `HERO_LINES`, `ABOUT`, `FEATURED` (exactly two projects), `FOCUS`,
  `CONTACT`, `LINKS`, `FOOTER`, `NAV`.
- `content/projects.ts` — the case studies behind `/work/[slug]`.
- `content/site.ts` — name, contact, socials, and `origin`.
- `content/work.ts` — maps a source image to the WebP variants that ship.

**Nothing on this site is invented.** A project with no shipped product says
so; a fact that could not be verified is absent rather than guessed. Keep it
that way.

## Adding a project image

Drop the source (JPG/PNG, at least 1680px wide) in `media/work/`, then:

    python3 scripts/encode-media.py

It writes `-1680.webp` and `-960.webp` into `public/work/`. Content points at
the source name; `content/work.ts` maps it to the right file.

## Things worth knowing before you change them

**Archivo carries a width axis, and that is the whole type system.** Set
narrow and heavy it is the display type the page is built on; at normal width
and a light weight it is the body copy. A width axis is what makes type this
large readable. 1955 loads for the wordmark only; Geist Mono is anything the
system says.

**`backdrop-filter: invert(1)` does not survive the build.** Lightning CSS
compiles it to `-webkit-backdrop-filter: invert()` with the argument stripped
and drops the unprefixed rule, and the browser rejects it. The READ MORE lens
is a real second `<img>`, inverted and clipped, pinned to the pixel against
the one behind it.

**`data-reveal` must sit on the element that is actually visible.** Put it on
a span that starts translated outside its own `overflow: hidden` parent and
the IntersectionObserver measures zero area, so the reveal never fires. Put it
on the mask.

**Nothing reveals in the bottom tenth of the screen** — that is what makes an
entrance start after a thing is properly on screen. The last line of the page
lives exactly there and cannot be scrolled past, so `Scroll.tsx` flushes
whatever is still waiting once the document end is reached.

**The navigation reads by difference blending**, which has nothing to invert
against while the ground passes through the middle greys. `html[data-nav]`
gives it an explicit colour for those two stretches. On narrow screens it
stops blending entirely and takes a short fade of its own, because the page
runs under it rather than past it in the margins.

**Featured Work's hover boundary is the image and only the image.** The state
is held in React, not in CSS `:hover`, so nested elements cannot fight over it
and nothing can be left switched on. The name sits above the image but is not
part of the boundary.

**A `button` with `display: contents` drops out of the tab order.** If a row
needs to be clickable, make the row the button.

## Legacy URLs

`next.config.ts` maps the previous site's Dutch and English routes to sections
of the one page (`/werk` -> `/#work`, and so on). They pointed at `/work` and
`/about` until those stopped being routes, which made every one of them a 308
into a 404.

## Fonts

Web-ready `.woff2` files live in `app/fonts/`. The licensed `.otf` originals
are kept in `_fonts-source/`, which is gitignored.

## `_backup-current-site/`

The complete previous implementation — the "neural node" experience — kept
whole so nothing written for it is lost. Nothing in it is imported. Its README
maps where each piece of the old content went.
