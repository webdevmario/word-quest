import { KID_DEFINITIONS } from '@/dictionary/kidDefinitions';
import { pick } from '@/game/random';
import type { Rng } from '@/game/random';
import { BUILT_IN_THEMES } from '@/game/themes';
import { tokenize } from '@/game/wordworm/board';

export interface BonusWord {
  word: string;
  clue: string;
}

/** Theme words with a kid-friendly clue, short enough to fit on the board. */
const CANDIDATES = [...new Set(BUILT_IN_THEMES.flatMap((t) => t.words))].filter(
  (w) => w.length >= 4 && w.length <= 6 && KID_DEFINITIONS[w] && tokenize(w)
);

export function pickBonusWord(
  minLength: number,
  avoid: string[] = [],
  rng: Rng = Math.random
): BonusWord {
  const pool = CANDIDATES.filter(
    (w) => w.length >= minLength && !avoid.includes(w)
  );
  const word = pick(rng, pool.length ? pool : CANDIDATES);
  return { word, clue: KID_DEFINITIONS[word]?.definition ?? '' };
}
