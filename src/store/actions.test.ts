import { dailyFor } from '@/game/wordguess/daily';
import { emptyData, loadData } from '@/services/storage';
import { createProfile, recordGuessGame, saveDaily } from '@/store/actions';
import { getData, resetStore } from '@/store/appStore';

const DAY = '2026-10-17';

const player = (id: string) => {
  const profile = getData().profiles.find((p) => p.id === id);
  if (!profile) {
    throw new Error('missing player');
  }
  return profile;
};

describe('Word Guess daily word', () => {
  beforeEach(() => resetStore(emptyData()));

  it('awards the word of the day only once a day', () => {
    const { id } = createProfile({
      name: 'Ava',
      avatar: '🦊',
      color: '#2EB872',
    });
    const win = { word: 'ROUND', won: true, tries: 1, points: 420, daily: DAY };

    const first = recordGuessGame(id, win);
    const second = recordGuessGame(id, win);
    recordGuessGame(id, win);

    const p = player(id);
    expect(p.points).toBe(420);
    expect(p.stats).toMatchObject({
      guessPlayed: 1,
      guessWon: 1,
      guessStreak: 1,
      dailyWins: 1,
      dailyPlayed: DAY,
    });
    expect(p.badges.daily3).toBeUndefined();
    expect(first.badges.length).toBeGreaterThan(0);
    expect(second).toEqual({ badges: [], newTitle: null, newWord: false });
  });

  it('ignores a replayed win after a loss the same day', () => {
    const { id } = createProfile({
      name: 'Ava',
      avatar: '🦊',
      color: '#2EB872',
    });
    recordGuessGame(id, {
      word: 'ROUND',
      won: false,
      tries: 6,
      points: 0,
      daily: DAY,
    });
    recordGuessGame(id, {
      word: 'ROUND',
      won: true,
      tries: 1,
      points: 420,
      daily: DAY,
    });

    const p = player(id);
    expect(p.points).toBe(0);
    expect(p.stats).toMatchObject({
      guessPlayed: 1,
      guessWon: 0,
      dailyWins: 0,
    });
  });

  it('awards again on the next day and for practice words', () => {
    const { id } = createProfile({
      name: 'Ava',
      avatar: '🦊',
      color: '#2EB872',
    });
    const win = { word: 'ROUND', won: true, tries: 2, points: 100 };
    recordGuessGame(id, { ...win, daily: DAY });
    recordGuessGame(id, { ...win, daily: '2026-10-18' });
    recordGuessGame(id, { ...win, daily: null });
    recordGuessGame(id, { ...win, daily: null });

    const p = player(id);
    expect(p.points).toBe(400);
    expect(p.stats).toMatchObject({ guessWon: 4, dailyWins: 2 });
  });

  it('saves progress so a half-played round resumes, then marks the result', () => {
    const { id } = createProfile({
      name: 'Ava',
      avatar: '🦊',
      color: '#2EB872',
    });
    const round = dailyFor(null, DAY, 'medium');
    saveDaily(id, { ...round, guesses: ['CRANE'], usedClue: true });

    // A reload reads storage again.
    resetStore(loadData());
    const resumed = dailyFor(player(id).daily, DAY, 'easy');
    expect(resumed).toMatchObject({
      guesses: ['CRANE'],
      usedClue: true,
      difficulty: 'medium',
    });

    recordGuessGame(id, {
      word: round.answer,
      won: true,
      tries: 2,
      points: 50,
      daily: DAY,
    });
    expect(player(id).daily?.result).toEqual({ won: true, tries: 2 });
  });
});
