# Matrix Portfolio

A Matrix-inspired portfolio site built with React + TypeScript. A small
passion project where I get to mix UI polish (motion, themes, canvas effects,
easter eggs) with a fun aesthetic — while keeping the codebase clean and easy
to extend.

## Highlights

- **Terminal-style hero** with a typed boot sequence, skippable via button.
- **Canvas Matrix rain** — 2D canvas, `performance.now()` animation loop,
  pauses when the tab is hidden and fully disables under
  `prefers-reduced-motion`.
- **Three themes** (Matrix / Reloaded / Revolutions) synced to the page via
  CSS custom properties, so switching palettes transitions colours
  everywhere in one paint.
- **Active-section nav** — a sticky top nav appears once the hero scrolls
  out and highlights the section currently under the viewport's midpoint
  (IntersectionObserver, no scroll listener).
- **Top-of-viewport scroll progress bar** driven by Framer Motion's
  `useScroll` + `useSpring`.
- **Click-to-copy contact** — mailto / tel entries copy to clipboard with a
  transient `copied ✓` badge instead of opening a mail client.
- **Accessibility** — skip-to-content link, full keyboard navigation, themed
  `:focus-visible` rings, ARIA labels on the theme radiogroup, and motion
  honouring `prefers-reduced-motion` at the Framer Motion, CSS, and canvas
  layers.
- **Easter eggs** — Konami code and typed phrase detectors (try "spoon" or
  "there is no spoon").

## Tech stack

- **Vite 8** (Rolldown-powered)
- **React 19 + TypeScript**
- **Framer Motion** for scroll-reveals, progress bar, reduced-motion config
- **Vitest + jsdom + React Testing Library** for hook tests
- **ESLint** with the typescript-eslint + react-hooks flat configs

## Bundle size

Current production build (gzipped):

| File                | gzipped |
| ------------------- | ------- |
| `index.html`        | 0.88 kB |
| `assets/index.css`  | 0.71 kB |
| `assets/index.js`   | 111 kB  |

Most of the JS is React + Framer Motion; the app code itself is small and
the canvas rain is hand-written (no external animation lib).

## Getting started

```bash
npm ci            # install
npm run dev       # local dev server (Vite)
npm test          # run the vitest suite once
npm run test:watch  # watch mode
npm run lint      # eslint
npm run build     # typecheck + production build
npm run preview   # preview the built bundle locally
```

## Project structure

```txt
src/
  components/
    Section.tsx             shared section layout + scroll-reveal wrapper
    SectionHeader.tsx       section tag + title + accent rule
    TerminalHero.tsx        boot-sequence hero with skip button
    MatrixRain2D.tsx        canvas rain background
    StickyNav.tsx           top nav, shown after hero, with active-link highlight
    ScrollProgress.tsx      themed top-of-viewport progress bar
    ThemeSwitcher.tsx       theme radiogroup (top right)
    EasterEggs.tsx          hidden commands (konami, phrases…)
    About / Skills / Projects / Timeline / Contact Section.tsx
  config/
    data.ts                 content: owner, skills, projects, timeline, socials, nav
    themes.ts               three Matrix-inspired palettes
    boot-sequence.ts        hero terminal boot lines
  hooks/
    useScrolledPastHero.ts  show/hide sticky nav based on scroll
    useActiveSection.ts     IntersectionObserver-backed active-section tracker
    useKeySequence.ts       konami / phrase detectors for easter eggs
    __tests__/              vitest unit tests for hooks
  styles/
    global.css              base styles + CSS custom properties + focus ring
    tokens.ts               small style helpers (cardStyle, WARN_ACCENT)
  App.tsx                   page layout + theme → CSS vars sync
  main.tsx                  app entry

public/
  favicon.svg               themed >_ terminal prompt mark
  og-image.png              1200×630 Open Graph preview

scripts/
  gen_og_image.py           regenerates og-image.png
```

## Customize it

If you're cloning this for your own portfolio, these are the spots to edit
first:

- **Content** → `src/config/data.ts` (owner, socials, projects, skills, timeline, nav)
- **Themes** → `src/config/themes.ts`
- **Boot text** → `src/config/boot-sequence.ts`
- **Meta / OG** → `index.html` (canonical URL, og:image URL)
- **OG image** → re-run `python3 scripts/gen_og_image.py` after changing
  your name / tagline (requires Pillow)
- **Section order** → `src/App.tsx`

## Notes for employers

This project is intentionally small and focused. The goal wasn't "enterprise
complexity" — it was to ship a portfolio that's visually memorable, performs
well, is easy to extend, and demonstrates the small details (accessibility,
reduced-motion, keyboard nav, testing) that make a site production-ready.

Happy to walk through any of the design decisions — the motion strategy, the
theming approach via CSS variables, the IntersectionObserver-based active
nav, or the accessibility trade-offs.

## License

Personal project — feel free to take inspiration. If you reuse substantial
parts, a credit link back would be appreciated.
