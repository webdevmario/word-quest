import type { Profile, Stats } from '@/game/types';

export interface Title {
  min: number;
  name: string;
  icon: string;
}

export const TITLES: Title[] = [
  { min: 0, name: 'Word Hatchling', icon: '🐣' },
  { min: 200, name: 'Letter Scout', icon: '🔎' },
  { min: 600, name: 'Page Turner', icon: '📖' },
  { min: 1500, name: 'Word Explorer', icon: '🧭' },
  { min: 3000, name: 'Bookworm', icon: '🐛' },
  { min: 6000, name: 'Word Wizard', icon: '🧙' },
  { min: 10000, name: 'Grand Librarian', icon: '🦉' },
  { min: 20000, name: 'Word Legend', icon: '🐉' },
];

export function titleFor(points: number): Title {
  return TITLES.filter((t) => points >= t.min).pop() ?? (TITLES[0] as Title);
}

export function nextTitle(points: number): Title | null {
  return TITLES.find((t) => t.min > points) ?? null;
}

/** 0–1 progress from the current title to the next. */
export function titleProgress(points: number): number {
  const current = titleFor(points);
  const next = nextTitle(points);
  if (!next) {
    return 1;
  }
  return (points - current.min) / (next.min - current.min);
}

export type BadgeGroup = 'search' | 'worm' | 'guess' | 'learning' | 'milestone';

export interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  group: BadgeGroup;
  earned: (stats: Stats, profile: Profile) => boolean;
}

const wordBookSize = (p: Profile) => Object.keys(p.wordBook).length;

export const BADGES: Badge[] = [
  // Word Search
  { id: 'first_word', icon: '🔍', name: 'First Find', description: 'Find your very first word', group: 'search', earned: (s) => s.wordsFound >= 1 },
  { id: 'first_puzzle', icon: '🧩', name: 'Puzzle Solver', description: 'Finish a word search', group: 'search', earned: (s) => s.puzzlesCompleted >= 1 },
  { id: 'golden', icon: '✨', name: 'Golden Touch', description: 'Find a golden word', group: 'search', earned: (s) => s.goldenFound >= 1 },
  { id: 'combo3', icon: '⚡', name: 'Lightning Fingers', description: 'Get a x3 combo', group: 'search', earned: (s) => s.bestCombo >= 3 },
  { id: 'speedy', icon: '🚀', name: 'Speed Reader', description: 'Finish a word search in under 60 seconds', group: 'search', earned: (s) => s.fastest !== null && s.fastest < 60 },
  { id: 'backwards', icon: '🔄', name: 'Backwards Brain', description: 'Find a word spelled backwards', group: 'search', earned: (s) => s.backwardsFound >= 1 },
  { id: 'diag10', icon: '↗️', name: 'Diagonal Dynamo', description: 'Find 10 diagonal words', group: 'search', earned: (s) => s.diagonalFound >= 10 },
  { id: 'pure', icon: '🧠', name: 'No Peeking', description: 'Finish Medium or harder with no hints', group: 'search', earned: (s) => s.noHintClears >= 1 },
  { id: 'hard', icon: '🔥', name: 'Hard Mode Hero', description: 'Finish a Hard word search', group: 'search', earned: (s) => (s.levelsCompleted.hard ?? 0) >= 1 },
  { id: 'expert', icon: '💎', name: 'Expert Explorer', description: 'Finish an Expert word search', group: 'search', earned: (s) => (s.levelsCompleted.expert ?? 0) >= 1 },
  { id: 'world', icon: '🗺️', name: 'World Traveler', description: 'Finish a puzzle in 8 different themes', group: 'search', earned: (s) => s.themesCompleted.length >= 8 },
  // Word Worm
  { id: 'wiggle', icon: '🐛', name: 'First Wiggle', description: 'Make a word in Word Worm', group: 'worm', earned: (s) => s.wormWords >= 1 },
  { id: 'long7', icon: '📏', name: 'Long Haul', description: 'Make a 7-letter word in Word Worm', group: 'worm', earned: (s) => s.wormLongest >= 7 },
  { id: 'gem5', icon: '💠', name: 'Gem Collector', description: 'Use 5 gem tiles', group: 'worm', earned: (s) => s.gemsUsed >= 5 },
  { id: 'fire3', icon: '🧯', name: 'Firefighter', description: 'Put out 3 fire tiles', group: 'worm', earned: (s) => s.firesPutOut >= 3 },
  { id: 'bonus', icon: '🎁', name: 'Bonus Brain', description: 'Make the bonus word', group: 'worm', earned: (s) => s.bonusWords >= 1 },
  { id: 'big_word', icon: '💰', name: 'Jackpot', description: 'Score 300+ points with one word', group: 'worm', earned: (s) => s.wormBestWord >= 300 },
  { id: 'worm100', icon: '🍎', name: 'Hungry Worm', description: 'Make 100 words in Word Worm', group: 'worm', earned: (s) => s.wormWords >= 100 },
  // Word Guess
  { id: 'guess_win', icon: '🔐', name: 'Code Cracker', description: 'Solve a Word Guess', group: 'guess', earned: (s) => s.guessWon >= 1 },
  { id: 'guess_quick', icon: '🔮', name: 'Mind Reader', description: 'Solve a Word Guess in 3 tries or fewer', group: 'guess', earned: (s) => s.guessBestTries !== null && s.guessBestTries <= 3 },
  { id: 'guess_streak5', icon: '🎳', name: 'On a Roll', description: 'Win 5 Word Guesses in a row', group: 'guess', earned: (s) => s.guessBestStreak >= 5 },
  { id: 'daily3', icon: '📅', name: 'Daily Reader', description: 'Solve 3 words of the day', group: 'guess', earned: (s) => s.dailyWins >= 3 },
  // Learning
  { id: 'curious', icon: '💡', name: 'Curious Mind', description: 'Open 10 word cards', group: 'learning', earned: (s) => s.cardsOpened >= 10 },
  { id: 'book25', icon: '📚', name: 'Book Lover', description: 'Collect 25 words in your Word Book', group: 'learning', earned: (_s, p) => wordBookSize(p) >= 25 },
  { id: 'book100', icon: '🏛️', name: 'Word Scholar', description: 'Collect 100 words in your Word Book', group: 'learning', earned: (_s, p) => wordBookSize(p) >= 100 },
  { id: 'book500', icon: '🎓', name: 'Walking Dictionary', description: 'Collect 500 words in your Word Book', group: 'learning', earned: (_s, p) => wordBookSize(p) >= 500 },
  // Milestones
  { id: 'puzzles10', icon: '🎯', name: 'Dedicated', description: 'Finish 10 games', group: 'milestone', earned: (s) => s.puzzlesCompleted + s.wormGames + s.guessPlayed >= 10 },
  { id: 'puzzles50', icon: '🏅', name: 'Unstoppable', description: 'Finish 50 games', group: 'milestone', earned: (s) => s.puzzlesCompleted + s.wormGames + s.guessPlayed >= 50 },
]; // prettier-ignore

/** Marks newly earned badges on the profile and returns them. */
export function awardBadges(profile: Profile, now = Date.now()): Badge[] {
  const earned: Badge[] = [];
  for (const badge of BADGES) {
    if (!profile.badges[badge.id] && badge.earned(profile.stats, profile)) {
      profile.badges[badge.id] = now;
      earned.push(badge);
    }
  }
  return earned;
}

export const defaultStats = (): Stats => ({
  wordsFound: 0,
  puzzlesCompleted: 0,
  goldenFound: 0,
  backwardsFound: 0,
  diagonalFound: 0,
  longestWord: 0,
  bestCombo: 0,
  bestPuzzleScore: 0,
  fastest: null,
  noHintClears: 0,
  themesCompleted: [],
  levelsCompleted: {},
  bestTimes: {},
  wormWords: 0,
  wormGames: 0,
  wormLongest: 0,
  wormBestWord: 0,
  wormBestGame: 0,
  gemsUsed: 0,
  firesPutOut: 0,
  bonusWords: 0,
  guessPlayed: 0,
  guessWon: 0,
  guessStreak: 0,
  guessBestStreak: 0,
  guessBestTries: null,
  guessDist: {},
  dailyPlayed: null,
  dailyWins: 0,
  cardsOpened: 0,
});

/** Adds a word to the player's Word Book. Returns true if it is new. */
export function collectWord(profile: Profile, word: string, now = Date.now()) {
  const key = word.toUpperCase();
  const entry = profile.wordBook[key];
  if (entry) {
    entry.count++;
    return false;
  }
  profile.wordBook[key] = { count: 1, firstFound: now };
  return true;
}
