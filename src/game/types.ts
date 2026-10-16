export type GameMode = 'search' | 'worm';
export type DifficultyKey = 'easy' | 'medium' | 'hard' | 'expert';

export interface Theme {
  id: string;
  name: string;
  icon: string;
  words: string[];
}

export interface Stats {
  // Word Search
  wordsFound: number;
  puzzlesCompleted: number;
  goldenFound: number;
  backwardsFound: number;
  diagonalFound: number;
  longestWord: number;
  bestCombo: number;
  bestPuzzleScore: number;
  fastest: number | null;
  noHintClears: number;
  themesCompleted: string[];
  levelsCompleted: Partial<Record<DifficultyKey, number>>;
  bestTimes: Partial<Record<DifficultyKey, number>>;
  // Word Worm
  wormWords: number;
  wormGames: number;
  wormLongest: number;
  wormBestWord: number;
  wormBestGame: number;
  gemsUsed: number;
  firesPutOut: number;
  bonusWords: number;
  // Learning
  cardsOpened: number;
}

export interface WordBookEntry {
  count: number;
  firstFound: number;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  createdAt: number;
  points: number;
  stats: Stats;
  /** Badge id → time earned. */
  badges: Record<string, number>;
  prefs: {
    mode: GameMode;
    difficulty: DifficultyKey;
    theme: string;
  };
  /** Every word this player has found, keyed by UPPERCASE word. */
  wordBook: Record<string, WordBookEntry>;
}

export interface CustomDefinition {
  definition: string;
  example?: string;
}

export interface CustomWordData {
  /** Parent-made themes; they show up next to the built-in ones. */
  lists: Theme[];
  /** Extra words accepted in Word Worm (UPPERCASE). */
  allowed: string[];
  /** Words never accepted in Word Worm (UPPERCASE). */
  blocked: string[];
  /** Parent-written meanings, keyed by UPPERCASE word. */
  definitions: Record<string, CustomDefinition>;
}

export interface Settings {
  muted: boolean;
  /** Read each found word aloud. */
  speakWords: boolean;
}

export interface AppData {
  version: 2;
  profiles: Profile[];
  settings: Settings;
  custom: CustomWordData;
}
