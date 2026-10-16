import type { Tier } from '@/game/scoring';

const PATTERNS: Record<Tier | 'tap' | 'miss', number[]> = {
  tap: [6],
  miss: [20, 40, 20],
  nice: [12],
  great: [14, 30, 14],
  excellent: [16, 30, 16, 30, 22],
  superb: [18, 25, 18, 25, 40],
  legendary: [20, 25, 20, 25, 20, 25, 60],
};

/** A small buzz on phones that support it (Android). Silently skipped elsewhere. */
export function buzz(kind: keyof typeof PATTERNS) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(PATTERNS[kind]);
    } catch {
      // Some browsers throw when vibration is blocked; it's only a nicety.
    }
  }
}
