import type { DailyRound } from '@/game/types';
import {
  dailyBlurb,
  dailyFor,
  dailyState,
  roundOutcome,
} from '@/game/wordguess/daily';
import { dailyAnswer } from '@/game/wordguess/guess';

const DAY = '2026-10-17';

const saved = (change: Partial<DailyRound> = {}): DailyRound => ({
  day: DAY,
  difficulty: 'medium',
  answer: dailyAnswer(DAY, 5),
  guesses: ['CRANE'],
  usedClue: false,
  result: null,
  ...change,
});

describe('dailyFor', () => {
  it('starts a fresh round with the day’s word', () => {
    const round = dailyFor(null, DAY, 'easy');
    expect(round).toMatchObject({ day: DAY, difficulty: 'easy', guesses: [] });
    expect(round.answer).toBe(dailyAnswer(DAY, 4));
  });

  it('resumes today’s round, even after a difficulty change', () => {
    const today = saved({ guesses: ['CRANE', 'SLATE'], usedClue: true });
    expect(dailyFor(today, DAY, 'expert')).toBe(today);
  });

  it('drops yesterday’s round', () => {
    const round = dailyFor(saved({ day: '2026-10-16' }), DAY, 'medium');
    expect(round.day).toBe(DAY);
    expect(round.guesses).toEqual([]);
  });
});

describe('dailyState', () => {
  it('is new until a round is saved for today', () => {
    expect(dailyState(null, null, DAY)).toBe('new');
    expect(dailyState(saved({ day: '2026-10-16' }), '2026-10-16', DAY)).toBe(
      'new'
    );
  });

  it('is playing while today’s round has no result', () => {
    expect(dailyState(saved(), null, DAY)).toBe('playing');
  });

  it('is done once today’s round has a result or was recorded', () => {
    expect(
      dailyState(saved({ result: { won: true, tries: 2 } }), null, DAY)
    ).toBe('done');
    expect(dailyState(null, DAY, DAY)).toBe('done');
  });
});

describe('roundOutcome', () => {
  it('wins on the guess that hits', () => {
    expect(roundOutcome(['CRANE', 'ROUND'], 'ROUND', 6)).toEqual({
      won: true,
      tries: 2,
    });
  });

  it('loses when the tries run out', () => {
    expect(roundOutcome(['A', 'B', 'C'], 'ROUND', 3)).toEqual({
      won: false,
      tries: 3,
    });
  });

  it('keeps going otherwise', () => {
    expect(roundOutcome(['CRANE'], 'ROUND', 6)).toBeNull();
  });
});

describe('dailyBlurb', () => {
  it('invites a new player', () => {
    expect(dailyBlurb(null, null, DAY)).toBe('A new secret word every day.');
  });

  it('counts the tries left', () => {
    expect(dailyBlurb(saved(), null, DAY)).toBe('Keep going! 5 tries left.');
    expect(
      dailyBlurb(saved({ guesses: ['A', 'B', 'C', 'D', 'E'] }), null, DAY)
    ).toBe('Keep going! 1 try left.');
  });

  it('shows today’s result without giving the word away', () => {
    const won = saved({ result: { won: true, tries: 3 } });
    const lost = saved({ result: { won: false, tries: 6 } });
    expect(dailyBlurb(won, DAY, DAY)).toBe(
      'You got it in 3! New word tomorrow.'
    );
    expect(dailyBlurb(lost, DAY, DAY)).toBe('So close! New word tomorrow.');
    expect(dailyBlurb(null, DAY, DAY)).toBe(
      'Done for today. New word tomorrow.'
    );
  });
});
