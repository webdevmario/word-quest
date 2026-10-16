import { DIFFICULTIES, DIRECTIONS } from '@/game/difficulty';
import type { Direction } from '@/game/difficulty';
import { pick, shuffle } from '@/game/random';
import type { Rng } from '@/game/random';
import { SCORING, wordSearchValue } from '@/game/scoring';
import type { DifficultyKey } from '@/game/types';

export type Cell = readonly [row: number, col: number];

export interface PlacedWord {
  text: string;
  cells: Cell[];
  dir: readonly [number, number];
  value: number;
  golden: boolean;
}

export interface Puzzle {
  size: number;
  grid: string[][];
  words: PlacedWord[];
  difficulty: DifficultyKey;
  themeId: string;
  mult: number;
}

/** Letters weighted roughly like English text, for filler. */
const FILLER = 'EEEEEEAAAARRRIIIOOOTTTNNNSSSLLCCUUDDPPMMHHGBFYWKV';

/** Words that contain each other (CAKE / PANCAKE) would be confusing together. */
const overlaps = (a: string, b: string) => a.includes(b) || b.includes(a);

function tryPlace(
  grid: (string | null)[][],
  text: string,
  directions: Direction[],
  rng: Rng
): Omit<PlacedWord, 'value' | 'golden'> | null {
  const n = grid.length;
  const len = text.length;
  const options: {
    r: number;
    c: number;
    dr: number;
    dc: number;
    crossing: boolean;
  }[] = [];
  for (const key of directions) {
    const [dr, dc] = DIRECTIONS[key];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const er = r + dr * (len - 1);
        const ec = c + dc * (len - 1);
        if (er < 0 || er >= n || ec < 0 || ec >= n) {
          continue;
        }
        let fits = true;
        let shared = 0;
        for (let i = 0; i < len; i++) {
          const existing = grid[r + dr * i]?.[c + dc * i];
          if (existing === null) {
            continue;
          }
          if (existing !== text[i]) {
            fits = false;
            break;
          }
          shared++;
        }
        if (fits && shared < len) {
          options.push({ r, c, dr, dc, crossing: shared > 0 });
        }
      }
    }
  }
  if (!options.length) {
    return null;
  }
  const crossing = options.filter((o) => o.crossing);
  const o =
    crossing.length && rng() < 0.35 ? pick(rng, crossing) : pick(rng, options);
  const cells: Cell[] = [];
  for (let i = 0; i < len; i++) {
    const r = o.r + o.dr * i;
    const c = o.c + o.dc * i;
    (grid[r] as (string | null)[])[c] = text[i] as string;
    cells.push([r, c]);
  }
  return { text, cells, dir: [o.dr, o.dc] };
}

function attempt(pool: string[], difficulty: DifficultyKey, rng: Rng) {
  const d = DIFFICULTIES[difficulty].search;
  const n = d.size;
  const grid: (string | null)[][] = Array.from({ length: n }, () =>
    Array<string | null>(n).fill(null)
  );
  const candidates = shuffle(
    rng,
    pool.filter(
      (w) => w.length >= d.minLen && w.length <= Math.min(d.maxLen, n)
    )
  );

  // Pick the target set first so the mix of lengths stays random...
  const chosen: string[] = [];
  const spare: string[] = [];
  for (const w of candidates) {
    if (chosen.length < d.count && !chosen.some((c) => overlaps(c, w))) {
      chosen.push(w);
    } else {
      spare.push(w);
    }
  }
  // ...then place longest first, swapping in spares when one won't fit.
  chosen.sort((a, b) => b.length - a.length);
  const placed: Omit<PlacedWord, 'value' | 'golden'>[] = [];
  for (const word of chosen) {
    let spot = tryPlace(grid, word, d.directions, rng);
    while (!spot && spare.length) {
      const i = spare.findIndex(
        (x) => !placed.some((p) => overlaps(p.text, x)) && !chosen.includes(x)
      );
      if (i < 0) {
        break;
      }
      spot = tryPlace(grid, spare.splice(i, 1)[0] as string, d.directions, rng);
    }
    if (spot) {
      placed.push(spot);
    }
  }
  return { grid, placed };
}

/** Builds a word search from a word pool (UPPERCASE words). */
export function generatePuzzle(
  pool: string[],
  difficulty: DifficultyKey,
  themeId: string,
  rng: Rng = Math.random
): Puzzle {
  const { mult, search } = DIFFICULTIES[difficulty];
  const cleanPool = [...new Set(pool.map((w) => w.toUpperCase()))].filter((w) =>
    /^[A-Z]+$/.test(w)
  );

  let best = attempt(cleanPool, difficulty, rng);
  for (let i = 0; i < 7 && best.placed.length < search.count; i++) {
    const next = attempt(cleanPool, difficulty, rng);
    if (next.placed.length > best.placed.length) {
      best = next;
    }
  }

  // Expert mixes in letters from the hidden words to create near-miss decoys.
  const wordLetters = best.placed.map((p) => p.text).join('') || FILLER;
  const grid = best.grid.map((row) =>
    row.map(
      (ch) =>
        ch ??
        (search.decoys && rng() < 0.55
          ? pick(rng, [...wordLetters])
          : pick(rng, [...FILLER]))
    )
  );

  const words: PlacedWord[] = best.placed.map((p) => ({
    ...p,
    golden: false,
    value: wordSearchValue(p.text, mult),
  }));
  if (words.length) {
    const golden = pick(rng, words);
    golden.golden = true;
    golden.value *= SCORING.goldenMultiplier;
  }
  words.sort((a, b) => a.text.localeCompare(b.text));

  return { size: search.size, grid, words, difficulty, themeId, mult };
}

/** Backwards = reads right-to-left or bottom-to-top. */
export const isBackwards = ([dr, dc]: readonly [number, number]) =>
  dc < 0 || (dc === 0 && dr < 0);

export const isDiagonal = ([dr, dc]: readonly [number, number]) =>
  dr !== 0 && dc !== 0;
