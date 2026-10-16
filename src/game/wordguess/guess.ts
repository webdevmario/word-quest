import { KID_DEFINITIONS } from '@/dictionary/kidDefinitions';
import { DIFFICULTIES } from '@/game/difficulty';
import { pick, seededRng } from '@/game/random';
import type { Rng } from '@/game/random';
import type { DifficultyKey } from '@/game/types';

/** Word Guess: a Wordle-style game with kid-friendly answers and clues. */

export type LetterState = 'correct' | 'present' | 'absent';

export interface GuessRules {
  length: number;
  maxGuesses: number;
  /** Revealed hints must be used in later guesses. */
  strict: boolean;
  blurb: string;
}

export const GUESS_RULES: Record<DifficultyKey, GuessRules> = {
  easy: { length: 4, maxGuesses: 7, strict: false, blurb: '4-letter words, 7 tries.' },
  medium: { length: 5, maxGuesses: 6, strict: false, blurb: '5-letter words, 6 tries.' },
  hard: { length: 5, maxGuesses: 6, strict: true, blurb: '5-letter words. Green and yellow letters must be used again.' },
  expert: { length: 6, maxGuesses: 6, strict: true, blurb: '6-letter words. Green and yellow letters must be used again.' },
}; // prettier-ignore

/**
 * Colors a guess the way Wordle does: greens first, then yellows only for
 * letters the answer still has left over, so repeated letters are fair.
 */
export function scoreGuess(guess: string, answer: string): LetterState[] {
  const g = guess.toUpperCase();
  const a = answer.toUpperCase();
  const result: LetterState[] = Array<LetterState>(g.length).fill('absent');
  const left = new Map<string, number>();
  for (let i = 0; i < a.length; i++) {
    if (g[i] === a[i]) {
      result[i] = 'correct';
    } else {
      const ch = a[i] as string;
      left.set(ch, (left.get(ch) ?? 0) + 1);
    }
  }
  for (let i = 0; i < g.length; i++) {
    const ch = g[i] as string;
    if (result[i] !== 'correct' && (left.get(ch) ?? 0) > 0) {
      result[i] = 'present';
      left.set(ch, (left.get(ch) ?? 0) - 1);
    }
  }
  return result;
}

const RANK: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 };

/** The best thing we know about each letter, for coloring the keyboard. */
export function keyboardStates(
  guesses: { word: string; states: LetterState[] }[]
): Record<string, LetterState> {
  const keys: Record<string, LetterState> = {};
  for (const { word, states } of guesses) {
    [...word.toUpperCase()].forEach((ch, i) => {
      const state = states[i] as LetterState;
      const prev = keys[ch];
      if (!prev || RANK[state] > RANK[prev]) {
        keys[ch] = state;
      }
    });
  }
  return keys;
}

/** In strict play, explains which revealed hint a guess forgot to use. */
export function strictProblem(
  guess: string,
  previous: { word: string; states: LetterState[] }[]
): string | null {
  const g = guess.toUpperCase();
  for (const { word, states } of previous) {
    const w = word.toUpperCase();
    for (let i = 0; i < w.length; i++) {
      if (states[i] === 'correct' && g[i] !== w[i]) {
        return `Letter ${i + 1} must be ${w[i]}`;
      }
    }
    for (let i = 0; i < w.length; i++) {
      const ch = w[i] as string;
      if (states[i] === 'present' && !g.includes(ch)) {
        return `Use the letter ${ch}`;
      }
    }
  }
  return null;
}

/** Answers come from words with kid-friendly definitions, so every game teaches. */
export function answerPool(length: number): string[] {
  return Object.keys(KID_DEFINITIONS)
    .filter((w) => w.length === length && /^[A-Z]+$/.test(w))
    .sort();
}

export function randomAnswer(
  length: number,
  avoid: string[] = [],
  rng: Rng = Math.random
) {
  const pool = answerPool(length);
  const fresh = pool.filter((w) => !avoid.includes(w));
  return pick(rng, fresh.length ? fresh : pool);
}

/** Local date as YYYY-MM-DD, so the daily word changes at the player's midnight. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The same word for everyone on this device on a given day and length. */
export function dailyAnswer(day: string, length: number): string {
  let hash = 2166136261;
  for (const ch of `${day}:${length}`) {
    hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  }
  return pick(seededRng(hash >>> 0), answerPool(length));
}

/** Fewer guesses earn more; a clue costs a quarter of the points. */
export function guessPoints(
  difficulty: DifficultyKey,
  guessesUsed: number,
  usedClue: boolean
): number {
  const { length, maxGuesses } = GUESS_RULES[difficulty];
  const base = 20 * length + (maxGuesses - guessesUsed + 1) * 30;
  const total = base * DIFFICULTIES[difficulty].mult;
  return Math.round(usedClue ? total * 0.75 : total);
}
