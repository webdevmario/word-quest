import { defaultStats } from '@/game/progression';
import type {
  AppData,
  CustomWordData,
  DifficultyKey,
  GameMode,
  Profile,
  Settings,
} from '@/game/types';

/** The only module that touches localStorage. */

export const STORAGE_KEY = 'wq_data_v2';
/** Key used by the original single-file prototype. */
export const LEGACY_KEY = 'wordquest.v1';

const LEVELS: DifficultyKey[] = ['easy', 'medium', 'hard', 'expert'];

export const emptyCustom = (): CustomWordData => ({
  lists: [],
  allowed: [],
  blocked: [],
  definitions: {},
});

export const defaultSettings = (): Settings => ({
  muted: false,
  speakWords: false,
});

export const emptyData = (): AppData => ({
  version: 2,
  profiles: [],
  settings: defaultSettings(),
  custom: emptyCustom(),
});

type Loose = Record<string, unknown>;
const isObject = (v: unknown): v is Loose =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Fills in anything missing so older or partial saves still load. */
export function normalizeProfile(raw: Loose): Profile {
  const prefs = isObject(raw.prefs) ? raw.prefs : {};
  const difficulty = LEVELS.includes(prefs.difficulty as DifficultyKey)
    ? (prefs.difficulty as DifficultyKey)
    : 'easy';
  const mode: GameMode =
    prefs.mode === 'worm' || prefs.mode === 'guess' ? prefs.mode : 'search';
  return {
    id: String(raw.id ?? `p${Date.now().toString(36)}`),
    name: String(raw.name ?? 'Player'),
    avatar: String(raw.avatar ?? '🦊'),
    color: String(raw.color ?? '#1F7A55'),
    createdAt: Number(raw.createdAt ?? Date.now()),
    points: Number(raw.points ?? 0),
    stats: { ...defaultStats(), ...(isObject(raw.stats) ? raw.stats : {}) },
    badges: isObject(raw.badges) ? (raw.badges as Record<string, number>) : {},
    prefs: {
      mode,
      difficulty,
      theme: typeof prefs.theme === 'string' ? prefs.theme : 'animals',
      guessDaily: prefs.guessDaily !== false,
    },
    wordBook: isObject(raw.wordBook)
      ? (raw.wordBook as Profile['wordBook'])
      : {},
  };
}

export function normalizeData(raw: unknown): AppData {
  if (!isObject(raw)) {
    return emptyData();
  }
  const custom = isObject(raw.custom) ? raw.custom : {};
  return {
    version: 2,
    profiles: Array.isArray(raw.profiles)
      ? raw.profiles.filter(isObject).map(normalizeProfile)
      : [],
    settings: {
      ...defaultSettings(),
      ...(isObject(raw.settings) ? raw.settings : {}),
    },
    custom: {
      ...emptyCustom(),
      ...(custom as Partial<CustomWordData>),
    },
  };
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadData(): AppData {
  const current = read(STORAGE_KEY);
  if (current) {
    return normalizeData(current);
  }
  // Bring players over from the prototype, keeping their points and badges.
  const legacy = read(LEGACY_KEY);
  if (isObject(legacy)) {
    return normalizeData({
      profiles: legacy.profiles,
      settings: legacy.settings,
    });
  }
  return emptyData();
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage can be full or disabled (private mode); the game keeps working.
  }
}
