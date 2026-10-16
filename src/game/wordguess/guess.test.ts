import {
  GUESS_RULES,
  answerPool,
  dailyAnswer,
  guessPoints,
  keyboardStates,
  randomAnswer,
  scoreGuess,
  strictProblem,
  todayKey,
} from '@/game/wordguess/guess';

describe('scoreGuess', () => {
  it('marks right spots, wrong spots and misses', () => {
    expect(scoreGuess('CRANE', 'CRATE')).toEqual([
      'correct',
      'correct',
      'correct',
      'absent',
      'correct',
    ]);
    expect(scoreGuess('STARE', 'TEARS')).toEqual([
      'present',
      'present',
      'correct',
      'correct',
      'present',
    ]);
  });

  it('handles repeated letters fairly', () => {
    // Only one E in the answer, already matched in place.
    expect(scoreGuess('GEESE', 'THESE')).toEqual([
      'absent',
      'absent',
      'correct',
      'correct',
      'correct',
    ]);
    // One L in the answer, matched in place, so the other L is gray.
    expect(scoreGuess('LLAMA', 'PLATE')).toEqual([
      'absent',
      'correct',
      'correct',
      'absent',
      'absent',
    ]);
  });
});

describe('keyboardStates', () => {
  it('keeps the best state for each letter', () => {
    const keys = keyboardStates([
      { word: 'BEAR', states: scoreGuess('BEAR', 'READ') },
      { word: 'READ', states: scoreGuess('READ', 'READ') },
    ]);
    expect(keys.R).toBe('correct');
    expect(keys.B).toBe('absent');
  });
});

describe('strictProblem', () => {
  const previous = [{ word: 'CRANE', states: scoreGuess('CRANE', 'CRISP') }];
  it('requires greens in place and yellows somewhere', () => {
    expect(strictProblem('BLIMP', previous)).toBe('Letter 1 must be C');
    expect(strictProblem('CRISP', previous)).toBeNull();
  });
});

describe('answers', () => {
  it('has plenty of kid words for every length', () => {
    for (const rules of Object.values(GUESS_RULES)) {
      expect(answerPool(rules.length).length).toBeGreaterThan(40);
    }
  });

  it('gives the same daily word all day', () => {
    expect(dailyAnswer('2026-10-16', 5)).toBe(dailyAnswer('2026-10-16', 5));
    expect(dailyAnswer('2026-10-16', 5)).toHaveLength(5);
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('avoids recent answers', () => {
    const pool = answerPool(4);
    const avoid = pool.slice(1);
    expect(randomAnswer(4, avoid)).toBe(pool[0]);
  });
});

describe('guessPoints', () => {
  it('rewards fewer guesses and charges for the clue', () => {
    expect(guessPoints('medium', 2, false)).toBeGreaterThan(
      guessPoints('medium', 5, false)
    );
    expect(guessPoints('medium', 3, true)).toBeLessThan(
      guessPoints('medium', 3, false)
    );
  });
});
