import {
  awardBadges,
  collectWord,
  defaultStats,
  nextTitle,
  titleFor,
  titleProgress,
} from '@/game/progression';
import {
  celebrationTier,
  comboBonus,
  lengthMultiplier,
  wordSearchValue,
} from '@/game/scoring';
import type { Profile } from '@/game/types';

const makeProfile = (): Profile => ({
  id: 'p1',
  name: 'Ava',
  avatar: '🦊',
  color: '#2EB872',
  createdAt: 0,
  points: 0,
  stats: defaultStats(),
  badges: {},
  prefs: { mode: 'search', difficulty: 'easy', theme: 'animals' },
  wordBook: {},
});

describe('titles', () => {
  it('climbs with points', () => {
    expect(titleFor(0).name).toBe('Word Hatchling');
    expect(titleFor(650).name).toBe('Page Turner');
    expect(nextTitle(650)?.name).toBe('Word Explorer');
    expect(titleProgress(400)).toBeCloseTo(0.5);
    expect(nextTitle(1_000_000)).toBeNull();
  });
});

describe('badges', () => {
  it('awards each badge once', () => {
    const p = makeProfile();
    p.stats.wordsFound = 1;
    expect(awardBadges(p, 5).map((b) => b.id)).toEqual(['first_word']);
    expect(awardBadges(p, 6)).toEqual([]);
    expect(p.badges.first_word).toBe(5);
  });

  it('counts the Word Book for learning badges', () => {
    const p = makeProfile();
    for (let i = 0; i < 25; i++) {
      collectWord(p, `word${i}`);
    }
    expect(collectWord(p, 'WORD1')).toBe(false);
    expect(awardBadges(p).map((b) => b.id)).toContain('book25');
  });
});

describe('scoring', () => {
  it('values rare letters and difficulty', () => {
    expect(wordSearchValue('CAT', 1)).toBe(25);
    expect(wordSearchValue('ZOO', 2)).toBe(120);
  });

  it('grows the length bonus', () => {
    expect(lengthMultiplier(3)).toBe(1);
    expect(lengthMultiplier(6)).toBe(2);
    expect(lengthMultiplier(10)).toBeGreaterThan(lengthMultiplier(9));
  });

  it('rewards combos and picks a celebration size', () => {
    expect(comboBonus(1, 1)).toBe(0);
    expect(comboBonus(3, 1.5)).toBe(30);
    expect(celebrationTier(3, 25)).toBe('nice');
    expect(celebrationTier(8, 50)).toBe('legendary');
  });
});
