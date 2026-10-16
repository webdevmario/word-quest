import { useSyncExternalStore } from 'react';

import { burst, GOLD, JEWELS, sparks } from '@/fx/confetti';
import { buzz } from '@/fx/haptics';
import { sound } from '@/fx/sound';
import type { Badge, Title } from '@/game/progression';
import type { Tier } from '@/game/scoring';

/**
 * Celebrations are fired from game code and drawn by <FxLayer />. Keeping them
 * in a tiny external store lets any component trigger one without prop wiring.
 */

export interface Point {
  x: number;
  y: number;
}

export interface WordCelebration {
  id: number;
  word: string;
  points: number;
  tier: Tier;
  color: string;
  /** Where the banner appears (usually the board's center). */
  center: Point;
  /** Where the score flies from (usually the word's center). */
  from: Point;
  chips: string[];
}

export type MascotMood = 'idle' | 'cheer' | 'wow' | 'think' | 'oops';

interface FxState {
  word: WordCelebration | null;
  toasts: { id: number; badge: Badge }[];
  title: { id: number; title: Title } | null;
  mascot: { mood: MascotMood; line: string | null; id: number };
  flyers: { id: number; from: Point; to: Point; points: number }[];
}

let state: FxState = {
  word: null,
  toasts: [],
  title: null,
  mascot: { mood: 'idle', line: null, id: 0 },
  flyers: [],
};
const listeners = new Set<() => void>();
let nextId = 1;

function set(change: Partial<FxState>) {
  state = { ...state, ...change };
  listeners.forEach((l) => l());
}

export function useFx<T>(select: (s: FxState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => select(state)
  );
}

const centerOf = (r: DOMRect): Point => ({
  x: r.left + r.width / 2,
  y: r.top + r.height / 2,
});

function scoreTarget(): Point | null {
  const el = document.querySelector('[data-score-target]');
  return el ? centerOf(el.getBoundingClientRect()) : null;
}

const CHEERS: Record<Tier, string[]> = {
  nice: ['Nice one!', 'Got it!', 'Yes!'],
  great: ['Great word!', 'Ooh, good one!', 'Wonderful!'],
  excellent: ['Excellent!', 'What a word!', 'Brilliant!'],
  superb: ['Superb!', 'Wow, wow, wow!', 'Spectacular!'],
  legendary: ['Legendary!', 'Unbelievable!', 'Word wizardry!'],
};

const pickLine = (lines: string[]) =>
  lines[Math.floor(Math.random() * lines.length)] ?? null;

let mascotTimer: ReturnType<typeof setTimeout> | undefined;
export function mascotSay(mood: MascotMood, line: string | null, ms = 2200) {
  clearTimeout(mascotTimer);
  set({ mascot: { mood, line, id: nextId++ } });
  mascotTimer = setTimeout(
    () => set({ mascot: { mood: 'idle', line: null, id: nextId++ } }),
    ms
  );
}

export interface CelebrateInput {
  word: string;
  points: number;
  tier: Tier;
  color: string;
  /** Screen rects of the tiles that made the word, in order. */
  tiles: DOMRect[];
  /** The board's rect; the banner centers on it. */
  board: DOMRect;
  chips?: string[];
}

let wordTimer: ReturnType<typeof setTimeout> | undefined;

/** The big moment: sparks from every tile, banner, score fly-up, sound, buzz. */
export function celebrate(input: CelebrateInput) {
  const { tiles, tier } = input;
  const big = tier === 'excellent' || tier === 'superb' || tier === 'legendary';
  const colors = [input.color, ...GOLD];
  tiles.forEach((rect, i) => {
    setTimeout(() => {
      const p = centerOf(rect);
      sparks(p.x, p.y, big ? 16 : 10, colors, big ? 1.3 : 1);
    }, i * 40);
  });

  const first = tiles[0];
  const last = tiles[tiles.length - 1];
  const from =
    first && last
      ? centerOf(
          new DOMRect(
            Math.min(first.left, last.left),
            Math.min(first.top, last.top),
            Math.abs(last.left - first.left) + first.width,
            Math.abs(last.top - first.top) + first.height
          )
        )
      : centerOf(input.board);
  const center = centerOf(input.board);

  if (big) {
    setTimeout(
      () =>
        burst(center.x, center.y, tier === 'legendary' ? 140 : 70, [
          input.color,
          ...GOLD,
          ...JEWELS,
        ]),
      tiles.length * 40
    );
  }

  clearTimeout(wordTimer);
  const celebration: WordCelebration = {
    id: nextId++,
    word: input.word,
    points: input.points,
    tier,
    color: input.color,
    center,
    from,
    chips: input.chips ?? [],
  };
  set({ word: celebration });
  wordTimer = setTimeout(
    () => {
      if (state.word?.id === celebration.id) {
        set({ word: null });
      }
    },
    big ? 1900 : 1300
  );

  const to = scoreTarget();
  if (to) {
    const flyer = { id: nextId++, from, to, points: input.points };
    set({ flyers: [...state.flyers, flyer] });
    setTimeout(
      () => set({ flyers: state.flyers.filter((f) => f.id !== flyer.id) }),
      900
    );
  }

  sound.success(tier, input.word.length);
  buzz(tier);
  mascotSay(big ? 'wow' : 'cheer', pickLine(CHEERS[tier]));
}

export function badgeToast(badge: Badge) {
  const toast = { id: nextId++, badge };
  set({ toasts: [...state.toasts, toast] });
  sound.badge();
  setTimeout(
    () => set({ toasts: state.toasts.filter((t) => t.id !== toast.id) }),
    4200
  );
}

/** Shows badges one after another so they don't arrive in a pile. */
export function queueBadges(badges: Badge[], delay = 900) {
  badges.forEach((b, i) => setTimeout(() => badgeToast(b), delay + i * 800));
}

export function titleReveal(title: Title, delay = 1600) {
  setTimeout(() => {
    set({ title: { id: nextId++, title } });
    sound.fanfare();
  }, delay);
}

export function dismissTitle() {
  set({ title: null });
}
