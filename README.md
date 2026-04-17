# Matrix Portfolio

A Matrix-inspired portfolio site built with React + TypeScript. It’s a small passion project where I get to mix UI polish (motion, themes, sections) with a fun aesthetic—while keeping the codebase clean and easy to extend.

## What’s inside

- **Matrix-style hero / rain effects**
- **Sections for About, Skills, Projects, Timeline, Contact**
- **Theme switching**
- **Smooth UI motion** (Framer Motion)

## Tech stack

- **Vite** (build tooling + dev server)
- **React + TypeScript**
- **Framer Motion**
- **ESLint**

## Getting started

Install dependencies:

```bash
npm ci
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Scripts

- **`npm run dev`**: start local dev server
- **`npm run build`**: typecheck + production build
- **`npm run preview`**: preview the production build
- **`npm run lint`**: run ESLint

## Project structure (high level)

```txt
src/
  components/
    Section.tsx          shared section layout + scroll-reveal wrapper
    SectionHeader.tsx    section tag + title + accent rule
    TerminalHero.tsx     boot-sequence hero
    MatrixRain2D.tsx     canvas rain background
    StickyNav.tsx        top nav revealed once the hero scrolls out
    ThemeSwitcher.tsx    theme pills (top right)
    EasterEggs.tsx       hidden commands (konami, phrases…)
    About / Skills / Projects / Timeline / Contact Section.tsx
  config/
    data.ts              content: owner, skills, projects, timeline, socials, nav
    themes.ts            three Matrix-inspired palettes
    boot-sequence.ts     hero terminal boot lines
  hooks/
    useScrolledPastHero.ts   show/hide sticky nav based on scroll
    useKeySequence.ts        konami / phrase detectors for easter eggs
  styles/
    global.css               base styles + CSS custom properties
    tokens.ts                small style helpers (e.g. cardStyle)
  App.tsx                    page layout + theme → CSS vars sync
  main.tsx                   app entry
```

## Customize it

If you’re cloning this for your own portfolio, these are the spots you’ll likely edit first:

- **Content**: `src/config/data.ts`
- **Themes**: `src/config/themes.ts`
- **Boot/intro text** (if enabled): `src/config/boot-sequence.ts`
- **Section layouts**: `src/components/*Section.tsx`

## Notes for employers

This project is intentionally small and focused. The goal wasn’t “enterprise complexity”—it was to ship a portfolio that’s visually memorable, performs well, and is straightforward to maintain.

If you’d like to talk about decisions/tradeoffs (animation strategy, theming approach, component structure), I’m happy to walk through it.

## License

Personal project — feel free to take inspiration. If you reuse substantial parts, a credit link back would be appreciated.
