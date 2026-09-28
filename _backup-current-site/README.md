# The site as it stood on 2026-09-29, before the editorial rebuild

This is the complete previous implementation — the "neural node" experience:
a boot sequence, a projected 3D sculpture, a Work environment whose media
surface was assembled from that sculpture's cubes, an About globe, the
Featured Work notification, and the case-study system.

It is kept whole so that nothing written or built for it is lost. Nothing in
here is imported by the live site; delete the folder when you are certain you
want none of it back.

## Where the content went

| Was | Is now |
|---|---|
| `content/site.ts` — SITE, ABOUT, PROFILE, SOCIALS | `content/portfolio.ts` (restructured) and still `content/site.ts` |
| `content/projects.ts` — the Goodreads case study, BEBO, jorisvrr.com | unchanged, still the source for `/work/[slug]` |
| `content/about.ts`, `boot.ts`, `crash.ts`, `transition.ts`, `work.ts`, `spotlight.ts` | here only — they are timelines for animations that no longer exist |
| `components/case/*` | still live: the case-study pages kept their components |
| `app/experience.css` | here only — replaced by `app/site.css` |

## What was deliberately dropped

The boot sequence and its audio gate, the [REBUILD] crash, the sculpture and
its projection (`lib/sculpture`), the globe (`components/about`), the Work
environment (`components/work`), the Featured Work notification, the VHS
layer, the atmosphere layers, and the sound system. Their assets are still in
`public/` (`audio/boot.*`, `data/land-*.json`, `blocknoise.png`).

## Content that was true then and is still true

- Name, email, phone, location, website: `content/site.ts`
- LinkedIn, Instagram, YouTube: `content/site.ts` SOCIALS (Instagram and
  YouTube were marked UNVERIFIED there and still are)
- The full Goodreads case study, built from the project's own repository
- Education read "HBO-ICT Business & Data Management"; the rebuild brief
  says "HBO-ICT — Software Engineering, 2026–2030". The new site uses the
  brief's version. If that is wrong, this file is where the old one lives.
