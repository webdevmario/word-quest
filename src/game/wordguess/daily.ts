import type { DailyRound, DifficultyKey } from '@/game/types';
import { dailyAnswer, GUESS_RULES } from '@/game/wordguess/guess';

/**
 * The word of the day is one round per player per day. It is saved as it is
 * played, so leaving or reloading resumes it instead of giving a fresh try.
 */

export type DailyState = 'new' | 'playing' | 'done';

/** Today's round: the saved one if it is from today, otherwise a fresh one. */
export function dailyFor(
  saved: DailyRound | null,
  day: string,
  difficulty: DifficultyKey
): DailyRound {
  if (saved?.day === day) {
    return saved;
  }
  return {
    day,
    difficulty,
    answer: dailyAnswer(day, GUESS_RULES[difficulty].length),
    guesses: [],
    usedClue: false,
    result: null,
  };
}

/** `dailyPlayed` also covers players who finished today before rounds were saved. */
export function dailyState(
  saved: DailyRound | null,
  dailyPlayed: string | null,
  day: string
): DailyState {
  if (dailyPlayed === day || (saved?.day === day && saved.result)) {
    return 'done';
  }
  return saved?.day === day ? 'playing' : 'new';
}

/** Whether the guesses so far end the round, and how. */
export function roundOutcome(
  guesses: string[],
  answer: string,
  maxGuesses: number
): { won: boolean; tries: number } | null {
  const hit = guesses.indexOf(answer);
  if (hit >= 0) {
    return { won: true, tries: hit + 1 };
  }
  return guesses.length >= maxGuesses
    ? { won: false, tries: guesses.length }
    : null;
}

/** The line under "Word of the day" on the setup screen. */
export function dailyBlurb(
  saved: DailyRound | null,
  dailyPlayed: string | null,
  day: string
): string {
  const state = dailyState(saved, dailyPlayed, day);
  if (state === 'playing' && saved) {
    const left =
      GUESS_RULES[saved.difficulty].maxGuesses - saved.guesses.length;
    return `Keep going! ${left} ${left === 1 ? 'try' : 'tries'} left.`;
  }
  if (state === 'done') {
    const result = saved?.day === day ? saved.result : null;
    if (result?.won) {
      return `You got it in ${result.tries}! New word tomorrow.`;
    }
    return result
      ? 'So close! New word tomorrow.'
      : 'Done for today. New word tomorrow.';
  }
  return 'A new secret word every day.';
}
