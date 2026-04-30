# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — ESLint with `eslint-config-next` flat config (`next/core-web-vitals`)
- Do **not** run `pnpm dev` / `yarn dev` / `next dev` — the user runs the dev server themselves.
- No test runner is configured.
- Package manager is pnpm (pinned via `packageManager` in `package.json`; `pnpm-lock.yaml` is committed). Deployed on Vercel at devcatapult.com.

## What this site is

Single-page Next.js 12 marketing site (Pages Router, JavaScript — no TypeScript) for **Catapult**, an independent studio that does **websites, SEO, and AI consulting**. The whole product surface is `pages/index.js` plus one Notion-backed contact API route.

## Design system (commit to it)

Brutalist aesthetic. Don't soften it.

- **Palette** (in `tailwind.config.js`): `bone` (#EAE6D8 cream bg) + `ink` (#080808 near-black) + `acid` (#CCFF02 lime accent). No dark-mode toggle.
- **Type**: `font-display` = Big Shoulders Display (massive uppercase headlines), `font-mono` / `font-sans` = Space Mono (everything else, body included). Loaded from Google Fonts in `pages/_document.js`.
- **Borders**: 2px solid ink, **no rounded corners**. Card grids use `gap-px bg-ink border-2 border-ink` so the grid lines themselves become the rules.
- **Hover**: hard color flips (`flip-card` class in `globals.css`), no soft transitions — service cards invert ink/bone on hover, `.flip-mark`/`.flip-accent`/`.flip-rule` swap accordingly.
- **Buttons**: `.btn-ink` (filled, hover→acid) and `.btn-acid` (acid fill that translates -3px and drops a 6px ink stamp shadow on hover). `.brutal-link` and `.chip` defined in `globals.css`.
- **Form fields**: `.field` class — transparent with 2px ink underline, `:focus` adds an acid background tint. Toggle chips use `data-active="true"`.

## Interactive primitives

These are the moving parts. Don't reimplement — reuse.

- **`components/Cursor.js`** — mounted once in `Container.js`. Two fixed divs (dot + lagging ring) with `mix-blend-mode: difference` over the page. Auto-detects `(hover: hover) and (pointer: fine)`; bails out on touch and `prefers-reduced-motion`. Adds `.is-hover` (over `a, button, input, textarea, [role="button"], [data-cursor], [data-magnetic]`), `.is-text` (over `[data-cursor='text']`), `.is-pressed` (mousedown). Native cursor is hidden globally in `globals.css` — every interactive must keep this contract or the cursor disappears.
- **`components/AsciiField.js`** — the hero centerpiece (and 404 hero). Renders `text` as a live monospace character grid: text → offscreen canvas → density mask → `<pre>` rendered every RAF frame, mapping density → char from `" .·:-=+*#%@"`. Each cell breathes via a sinusoidal time offset; the cursor disrupts cells inside `haloRadius` by replacing them with random `NOISE_CHARS`. Grid resolution adapts to viewport (46×13 / 74×18 / 100×24 / 118×26), font-size auto-scales via ResizeObserver to the measured Space Mono char width, and the mask is rebuilt only after `document.fonts.ready` so Big Shoulders has loaded. Respects `prefers-reduced-motion`. The wrapping div carries `role="img"` + `aria-label={text}` for screen readers and `data-cursor="text"` so the custom cursor flips to its I-beam shape over it. **Do not reintroduce `<Scramble>`** — the user explicitly rejected the letter-flip aesthetic.
- **`components/Magnetic.js`** — wraps a child so it translates toward the cursor while inside `radius` px. Uses `[data-magnetic]` so the cursor picks it up as interactive.
- **`lib/useReveal.js`** — IntersectionObserver hook. Returns `[ref, visible]`; pair with `.reveal-up` + `.is-visible` classes for staggered scroll reveals (the convention used by every section in `index.js`).
- **Spotlight on flip-cards** — `.flip-card` defines `--mx`/`--my` CSS vars and a radial-gradient `::before` that's invisible until hover. `pages/index.js` exports a top-level `spotlight(e)` handler attached via `onMouseMove` to every `<ServiceCard>` and `<Principle>` — it writes the cursor's element-relative position into those vars so the acid-tinted halo follows the cursor across the dark hovered card.
- **Hero parallax** — the giant `*` in `pages/index.js Hero` translates with the cursor via a direct mousemove listener (not Magnetic — the offset is window-relative, not element-relative).

## Architecture notes

- **Pages Router**: `pages/index.js` is the only page. `pages/_app.js` is minimal — just `reportWebVitals` piping to `window.gtag` and rendering `<Component />`. `pages/_document.js` injects Google Analytics, Google Fonts (preconnect + stylesheet), and a `ProfessionalService` JSON-LD `<script>` for SEO.
- **Layout shell** (`components/Container.js`): owns `<Head>` SEO/OG meta with canonical `https://devcatapult.com${asPath}`, mounts `<Cursor />` once, and renders the sticky header + brutalist footer. Wrap any new page in it.
- **Subscribe flow**: `components/Subscribe.js` (form, Website/SEO/AI/Multiple toggle) → `POST /api/subscribe` → `pages/api/subscribe.js` writes a row to a Notion database via `@notionhq/client`. Requires env vars `NOTION_TOKEN` and `NOTION_DATABASE_ID`. The Notion DB needs `title` (title), `Type` (select), `Company` (rich_text). The form's "project details" textarea is sent as `company_url` and concatenated into the `Company` field server-side — this is intentional so the existing Notion DB schema doesn't need to change.
- **Absolute imports**: `jsconfig.json` sets `baseUrl: "."`, so imports use bare paths like `import Container from "components/Container"`, `import useReveal from "lib/useReveal"`, `import "styles/globals.css"`.
- **Tailwind content scan**: `pages/**/*.js` and `components/**/*.js` only. New top-level dirs need to be added to `content` in `tailwind.config.js`. The typography plugin was removed — do not re-add unless you're bringing back prose.
