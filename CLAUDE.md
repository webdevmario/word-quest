# CLAUDE.md — Word Quest

Word game for kids (two children share a device): themed Word Search and a Bookworm-style mode called Word Worm, with profiles, points, titles, badges, a Word Book and kid-friendly definitions. React 19 + TypeScript + Vite + Tailwind v4 + Motion. No backend; data lives in localStorage.

## Commands

```bash
npm run dev        # port 5520
npm run validate   # typecheck + lint + format:check + unit tests — run before committing
npm run test:e2e   # Playwright smoke tests (starts the dev server)
```

## Architecture

- `src/game/` is pure TypeScript with no React. Put rules, scoring and generation here and test them with a seeded RNG (`seededRng`). Every function that uses randomness takes an `rng` argument.
- `src/store/appStore.ts` holds one `AppData` object. Change it only through `updateData()`, normally via `src/store/actions.ts`. Actions return `Rewards` (new badges, new title, whether the word is new to the Word Book) so screens can celebrate.
- `src/services/storage.ts` is the only file that touches localStorage. Bump the key and add a migration in `normalizeData` when the schema changes.
- `src/fx/fxBus.ts` drives celebrations. Game code calls `celebrate()`, `queueBadges()`, `titleReveal()` and `mascotSay()`; `<FxLayer />` draws them. Sounds are synthesized in `fx/sound.ts`, so there are no audio files.
- Word Worm board: column-major `columns[c][r]`, row 0 at the top, odd columns shifted half a tile down. `neighbors()` encodes that. Tiles keep an `id` so React/Motion can animate gravity.
- Navigation is a small context (`app/nav.tsx`), not a router.

## Conventions

- Strict TypeScript, no `any`. `@/` alias for imports. Import order is enforced by ESLint.
- Tailwind utilities for layout. Materials and animations (`.wood`, `.paper`, `.tile`, `.tray`) live in `src/styles/index.css`.
- On Word Worm tiles, keep positioning on the outer `motion.div` and effects on the inner `.tile`. CSS animations on `.tile` set `transform` and would override Motion's positioning.
- Copy is written for kids: short, warm, plain verbs, sentence case.
- Tests sit next to source files (`*.test.ts`). The jsdom setup clears localStorage after each test.
