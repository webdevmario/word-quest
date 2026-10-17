import { DIFFICULTIES } from '@/game/difficulty';
import { awardBadges, collectWord, titleFor } from '@/game/progression';
import type { Badge, Title } from '@/game/progression';
import { SCORING } from '@/game/scoring';
import type {
  AppData,
  CustomDefinition,
  DailyRound,
  DifficultyKey,
  Profile,
  Settings,
  Theme,
} from '@/game/types';
import { normalizeProfile } from '@/services/storage';
import { updateData } from '@/store/appStore';

/** What a change earned, so the UI can celebrate it. */
export interface Rewards {
  badges: Badge[];
  newTitle: Title | null;
  newWord: boolean;
}

function withProfile(
  id: string,
  change: (p: Profile, data: AppData) => { newWord?: boolean } | void
): Rewards {
  return updateData((data) => {
    const profile = data.profiles.find((p) => p.id === id);
    if (!profile) {
      return { badges: [], newTitle: null, newWord: false };
    }
    const before = titleFor(profile.points);
    const out = change(profile, data);
    const after = titleFor(profile.points);
    return {
      badges: awardBadges(profile),
      newTitle: after !== before ? after : null,
      newWord: out?.newWord ?? false,
    };
  });
}

// ---------- Profiles ----------

export interface ProfileInput {
  name: string;
  avatar: string;
  color: string;
}

export function createProfile(input: ProfileInput): Profile {
  return updateData((data) => {
    const profile = normalizeProfile({
      ...input,
      id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    });
    data.profiles.push(profile);
    return profile;
  });
}

export function editProfile(id: string, input: ProfileInput) {
  updateData((data) => {
    const p = data.profiles.find((x) => x.id === id);
    if (p) {
      Object.assign(p, input);
    }
  });
}

export function deleteProfile(id: string) {
  updateData((data) => {
    data.profiles = data.profiles.filter((p) => p.id !== id);
  });
}

export function resetProgress(id: string) {
  updateData((data) => {
    const i = data.profiles.findIndex((p) => p.id === id);
    const p = data.profiles[i];
    if (p) {
      data.profiles[i] = normalizeProfile({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        createdAt: p.createdAt,
        prefs: p.prefs,
      });
    }
  });
}

export function setPrefs(id: string, prefs: Partial<Profile['prefs']>) {
  updateData((data) => {
    const p = data.profiles.find((x) => x.id === id);
    if (p) {
      Object.assign(p.prefs, prefs);
    }
  });
}

// ---------- Word Search ----------

export interface SearchWordEvent {
  word: string;
  points: number;
  golden: boolean;
  backwards: boolean;
  diagonal: boolean;
  combo: number;
}

export function recordSearchWord(id: string, e: SearchWordEvent): Rewards {
  return withProfile(id, (p) => {
    const s = p.stats;
    p.points += e.points;
    s.wordsFound++;
    if (e.golden) {
      s.goldenFound++;
    }
    if (e.backwards) {
      s.backwardsFound++;
    }
    if (e.diagonal) {
      s.diagonalFound++;
    }
    s.longestWord = Math.max(s.longestWord, e.word.length);
    s.bestCombo = Math.max(s.bestCombo, e.combo);
    return { newWord: collectWord(p, e.word) };
  });
}

export interface PuzzleSummary {
  difficulty: DifficultyKey;
  themeId: string;
  seconds: number;
  wordCount: number;
  hintsUsed: number;
  wordPoints: number;
}

export interface PuzzleBonuses {
  clear: number;
  speed: number;
  noHint: number;
  total: number;
  record: boolean;
}

export function puzzleBonuses(
  summary: PuzzleSummary
): Omit<PuzzleBonuses, 'record'> {
  const d = DIFFICULTIES[summary.difficulty];
  const clear = Math.round(SCORING.clearBonus * d.mult);
  const par = summary.wordCount * d.search.parPerWord;
  const speed = Math.max(0, Math.round((par - summary.seconds) * d.mult));
  const noHint =
    summary.hintsUsed === 0 ? Math.round(SCORING.noHintBonus * d.mult) : 0;
  return { clear, speed, noHint, total: clear + speed + noHint };
}

export function completePuzzle(
  id: string,
  summary: PuzzleSummary
): Rewards & { bonuses: PuzzleBonuses } {
  const base = puzzleBonuses(summary);
  let record = false;
  const rewards = withProfile(id, (p) => {
    const s = p.stats;
    p.points += base.total;
    s.puzzlesCompleted++;
    s.levelsCompleted[summary.difficulty] =
      (s.levelsCompleted[summary.difficulty] ?? 0) + 1;
    if (
      summary.themeId !== 'mix' &&
      !s.themesCompleted.includes(summary.themeId)
    ) {
      s.themesCompleted.push(summary.themeId);
    }
    const prev = s.bestTimes[summary.difficulty];
    record = prev !== undefined && summary.seconds < prev;
    if (prev === undefined || summary.seconds < prev) {
      s.bestTimes[summary.difficulty] = summary.seconds;
    }
    s.fastest =
      s.fastest === null
        ? summary.seconds
        : Math.min(s.fastest, summary.seconds);
    if (summary.hintsUsed === 0 && summary.difficulty !== 'easy') {
      s.noHintClears++;
    }
    s.bestPuzzleScore = Math.max(
      s.bestPuzzleScore,
      summary.wordPoints + base.total
    );
  });
  return { ...rewards, bonuses: { ...base, record } };
}

// ---------- Word Worm ----------

export interface WormWordEvent {
  word: string;
  points: number;
  gemsUsed: number;
  firesPutOut: number;
  bonusWord: boolean;
}

export function recordWormWord(id: string, e: WormWordEvent): Rewards {
  return withProfile(id, (p) => {
    const s = p.stats;
    p.points += e.points;
    s.wormWords++;
    s.wormLongest = Math.max(s.wormLongest, e.word.length);
    s.wormBestWord = Math.max(s.wormBestWord, e.points);
    s.gemsUsed += e.gemsUsed;
    s.firesPutOut += e.firesPutOut;
    if (e.bonusWord) {
      s.bonusWords++;
    }
    return { newWord: collectWord(p, e.word) };
  });
}

/** Points earned outside a single word, e.g. reaching a new chapter. */
export function addPoints(id: string, points: number): Rewards {
  return withProfile(id, (p) => {
    p.points += points;
  });
}

export function finishWormGame(id: string, score: number): Rewards {
  return withProfile(id, (p) => {
    p.stats.wormGames++;
    p.stats.wormBestGame = Math.max(p.stats.wormBestGame, score);
  });
}

// ---------- Word Guess ----------

export interface GuessGameEvent {
  word: string;
  won: boolean;
  tries: number;
  points: number;
  /** Set for the word of the day: its date key. */
  daily: string | null;
}

/** Saves word-of-the-day progress so it resumes after leaving or reloading. */
export function saveDaily(id: string, round: DailyRound) {
  updateData((data) => {
    const profile = data.profiles.find((p) => p.id === id);
    if (profile) {
      profile.daily = { ...round, guesses: [...round.guesses] };
    }
  });
}

export function recordGuessGame(id: string, e: GuessGameEvent): Rewards {
  return withProfile(id, (p) => {
    const s = p.stats;
    // The word of the day counts once a day, however it gets replayed.
    if (e.daily && s.dailyPlayed === e.daily) {
      return;
    }
    s.guessPlayed++;
    if (e.daily) {
      s.dailyPlayed = e.daily;
      if (p.daily?.day === e.daily) {
        p.daily.result = { won: e.won, tries: e.tries };
      }
    }
    if (!e.won) {
      s.guessStreak = 0;
      return;
    }
    p.points += e.points;
    s.guessWon++;
    s.guessStreak++;
    s.guessBestStreak = Math.max(s.guessBestStreak, s.guessStreak);
    s.guessBestTries =
      s.guessBestTries === null ? e.tries : Math.min(s.guessBestTries, e.tries);
    s.guessDist[e.tries] = (s.guessDist[e.tries] ?? 0) + 1;
    if (e.daily) {
      s.dailyWins++;
    }
    return { newWord: collectWord(p, e.word) };
  });
}

// ---------- Learning ----------

export function noteCardOpened(id: string): Rewards {
  return withProfile(id, (p) => {
    p.stats.cardsOpened++;
  });
}

// ---------- Settings & parent word lists ----------

export function updateSettings(change: Partial<Settings>) {
  updateData((data) => {
    Object.assign(data.settings, change);
  });
}

export function saveCustomList(list: Theme) {
  updateData((data) => {
    const i = data.custom.lists.findIndex((l) => l.id === list.id);
    if (i >= 0) {
      data.custom.lists[i] = list;
    } else {
      data.custom.lists.push(list);
    }
  });
}

export function deleteCustomList(listId: string) {
  updateData((data) => {
    data.custom.lists = data.custom.lists.filter((l) => l.id !== listId);
  });
}

export function setWordRules(allowed: string[], blocked: string[]) {
  updateData((data) => {
    data.custom.allowed = allowed;
    data.custom.blocked = blocked;
  });
}

export function setCustomDefinition(
  word: string,
  def: CustomDefinition | null
) {
  updateData((data) => {
    const key = word.toUpperCase();
    if (def) {
      data.custom.definitions[key] = def;
    } else {
      delete data.custom.definitions[key];
    }
  });
}
