import type { DifficultyKey } from '@/game/types';

export type Direction = 'E' | 'S' | 'SE' | 'NE' | 'W' | 'N' | 'NW' | 'SW';

/** [rowStep, colStep] */
export const DIRECTIONS: Record<Direction, readonly [number, number]> = {
  E: [0, 1],
  S: [1, 0],
  SE: [1, 1],
  NE: [-1, 1],
  W: [0, -1],
  N: [-1, 0],
  NW: [-1, -1],
  SW: [1, -1],
};

const ALL_DIRECTIONS = Object.keys(DIRECTIONS) as Direction[];

export interface Difficulty {
  key: DifficultyKey;
  name: string;
  icon: string;
  /** Point multiplier shared by both modes. */
  mult: number;
  search: {
    blurb: string;
    size: number;
    count: number;
    minLen: number;
    maxLen: number;
    directions: Direction[];
    /** Seconds per word before the speed bonus runs out. */
    parPerWord: number;
    decoys: boolean;
  };
  worm: {
    blurb: string;
    minWordLength: number;
    /** Chance a fire tile appears after a short word. */
    fireChance: number;
    /** Words this short or shorter can bring fire. */
    fireWordMax: number;
  };
}

export const DIFFICULTIES: Record<DifficultyKey, Difficulty> = {
  easy: {
    key: 'easy',
    name: 'Easy',
    icon: '🌱',
    mult: 1,
    search: {
      blurb: 'Small grid. Words go across and down.',
      size: 8,
      count: 6,
      minLen: 3,
      maxLen: 5,
      directions: ['E', 'S'],
      parPerWord: 15,
      decoys: false,
    },
    worm: {
      blurb: 'Take your time. Fire tiles start in chapter 3.',
      minWordLength: 3,
      fireChance: 0,
      fireWordMax: 0,
    },
  },
  medium: {
    key: 'medium',
    name: 'Medium',
    icon: '🌿',
    mult: 1.5,
    search: {
      blurb: 'Bigger grid. Diagonals join in.',
      size: 10,
      count: 8,
      minLen: 3,
      maxLen: 7,
      directions: ['E', 'S', 'SE', 'NE'],
      parPerWord: 18,
      decoys: false,
    },
    worm: {
      blurb: 'Short words can start fire tiles.',
      minWordLength: 3,
      fireChance: 0.3,
      fireWordMax: 3,
    },
  },
  hard: {
    key: 'hard',
    name: 'Hard',
    icon: '🔥',
    mult: 2,
    search: {
      blurb: 'Words can hide backwards.',
      size: 12,
      count: 10,
      minLen: 4,
      maxLen: 9,
      directions: ALL_DIRECTIONS,
      parPerWord: 22,
      decoys: false,
    },
    worm: {
      blurb: 'Fire comes more often.',
      minWordLength: 3,
      fireChance: 0.45,
      fireWordMax: 4,
    },
  },
  expert: {
    key: 'expert',
    name: 'Expert',
    icon: '💎',
    mult: 3,
    search: {
      blurb: 'Huge grid with sneaky decoy letters.',
      size: 15,
      count: 13,
      minLen: 5,
      maxLen: 12,
      directions: ALL_DIRECTIONS,
      parPerWord: 26,
      decoys: true,
    },
    worm: {
      blurb: 'Words need 4+ letters. Lots of fire.',
      minWordLength: 4,
      fireChance: 0.55,
      fireWordMax: 4,
    },
  },
};

export const DIFFICULTY_ORDER: DifficultyKey[] = [
  'easy',
  'medium',
  'hard',
  'expert',
];
