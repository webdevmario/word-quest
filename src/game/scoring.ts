/** Scrabble-style letter values: rare letters are worth more. */
export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
}; // prettier-ignore

export const SCORING = {
  pointsPerLetterValue: 5,
  goldenMultiplier: 2,
  comboWindowMs: 8000,
  comboStep: 10,
  clearBonus: 50,
  noHintBonus: 25,
  bonusWordMultiplier: 3,
  fireOutBonus: 25,
} as const;

export const letterValue = (letter: string) =>
  [...letter.toUpperCase()].reduce((s, ch) => s + (LETTER_VALUES[ch] ?? 1), 0);

/** Base value of a Word Search word. */
export function wordSearchValue(text: string, mult: number): number {
  return Math.round(letterValue(text) * SCORING.pointsPerLetterValue * mult);
}

/** Longer words earn a growing bonus in Word Worm. */
export function lengthMultiplier(length: number): number {
  if (length <= 3) {
    return 1;
  }
  const table = [1, 1, 1, 1, 1.25, 1.5, 2, 2.5, 3];
  return table[length] ?? 3 + (length - 8) * 0.75;
}

export function comboBonus(combo: number, mult: number): number {
  return combo >= 2 ? Math.round(SCORING.comboStep * (combo - 1) * mult) : 0;
}

export type Tier = 'nice' | 'great' | 'excellent' | 'superb' | 'legendary';

export const TIER_LABELS: Record<Tier, string> = {
  nice: 'Nice!',
  great: 'Great!',
  excellent: 'Excellent!',
  superb: 'Superb!',
  legendary: 'Legendary!',
};

/** How big the celebration should be, from word length and points. */
export function celebrationTier(length: number, points: number): Tier {
  if (length >= 8 || points >= 400) {
    return 'legendary';
  }
  if (length >= 7 || points >= 250) {
    return 'superb';
  }
  if (length >= 6 || points >= 150) {
    return 'excellent';
  }
  if (length >= 5 || points >= 80) {
    return 'great';
  }
  return 'nice';
}
