# Word Quest

A word game for kids with three ways to play, shared player profiles, points, titles, badges, and a kid-friendly dictionary.

- **Word Search** — find the hidden words from a theme. Drag across letters, or tap the first letter and then the last. Four levels, from an 8×8 grid with words going across and down to a 15×15 grid with backwards words and decoy letters.
- **Word Worm** — a Bookworm-style game. Link touching letter tiles (odd columns sit half a tile lower, so each tile has up to six neighbors) to make any real word, and Inky the bookworm eats it. Used tiles disappear and new ones drop in.
  - **Gem tiles:** long words leave gems that multiply later scores: emerald (5 letters), amber (6), sapphire (7), diamond (8), crystal (9+).
  - **Fire tiles:** short words can start fires that burn the tile below each turn. If one reaches the bottom, the game ends; use it in a word to put it out. Fire gets more frequent each chapter (on Easy it starts in chapter 3), and the board glows red when a fire is close to the bottom.
  - **Also:** a bonus word each round given as a definition clue, chapters that put out every fire, the Qu tile, shuffles, hints, and a tile guide shown the first time.
- **Word Guess** — a Wordle-style game: guess the secret word, with green, yellow and gray clues. Choose the word of the day or practice words. Easy uses 4-letter words with 7 tries, Expert 6-letter words where revealed hints must be reused. Every answer has a kid-friendly meaning, available as an optional clue.

Every word found is saved to that player's **Word Book**. Tapping a word opens a word card with a kid-friendly meaning, an example sentence, and buttons that read it aloud or spell it out.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5520
```

Requires Node 24 (see `.nvmrc`).

## Scripts

| Command                 | What it does                                         |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | Start the dev server on port 5520                    |
| `npm run build`         | Typecheck and build to `dist/`                       |
| `npm run preview`       | Serve the production build on port 5521              |
| `npm run lint`          | ESLint, zero warnings allowed                        |
| `npm run format`        | Format everything with Prettier                      |
| `npm run typecheck`     | TypeScript check                                     |
| `npm test`              | Unit and component tests (Vitest)                    |
| `npm run test:watch`    | Tests in watch mode                                  |
| `npm run test:coverage` | Coverage report in `coverage/`                       |
| `npm run test:e2e`      | Playwright smoke tests on desktop and phone sizes    |
| `npm run validate`      | Typecheck, lint, format check and tests (CI runs it) |
| `npm run words:build`   | Rebuild the bundled word lists from their sources    |

A pre-commit hook (Husky + lint-staged) lints and formats staged files.

## Editor setup

Open the folder in VS Code and accept the recommended extensions (ESLint, Prettier, Tailwind CSS, Vitest, Playwright). Format-on-save and ESLint fixes are configured in `.vscode/settings.json`. The Run and Debug panel has "Debug app in Chrome" and "Debug current test file".

## Project layout

```
src/
├── app/          App shell, screen navigation, current player
├── components/   Shared UI: buttons, dialog, book cover, mascot, HUD
├── dictionary/   Word list loading, kid definitions, lookup, read-aloud
├── features/     Screens: profiles, setup, wordsearch, wordworm, learn, trophies, parent
├── fx/           Celebrations: sound synth, confetti, haptics, banner layer
├── game/         Pure, tested game logic (no React)
├── services/     localStorage (the only place that touches it)
├── store/        App data store and actions
└── styles/       Tailwind theme tokens and materials (wood, felt, parchment tiles)
```

## The dictionary

- `public/dict/words.txt` — about 168,000 words from the public-domain ENABLE list, 3–15 letters, with rude words removed. Word Worm checks words against it.
- `public/dict/common.txt` — about 8,000 common words, used so hints suggest words kids know.
- `src/dictionary/kidDefinitions.ts` — about 750 kid-friendly definitions with syllables and example sentences, covering every theme word plus common everyday words.
- Words without a saved meaning are looked up online at [dictionaryapi.dev](https://dictionaryapi.dev) when the device is online.
- Grown-ups can add word lists (each becomes a Word Search theme, with optional meanings), allow extra words, and block words. The Grown-ups area is behind a quick multiplication question.

## Data

Everything is stored in the browser's localStorage under `wq_data_v2`, so each device keeps its own players. Players from the original prototype (`wordquest.v1`) are carried over automatically.
