import { DIFFICULTIES } from '@/game/difficulty';
import type { DifficultyKey } from '@/game/types';
import type { Board, TurnRules } from '@/game/wordworm/board';

/** Easy stays calm at first, then fire tiles join in from this chapter. */
export const EASY_FIRE_CHAPTER = 3;

/**
 * Fire gets more likely as chapters go by, like Bookworm. Longer words stay
 * safe; short words are what bring fire.
 */
export function fireRules(
  difficulty: DifficultyKey,
  chapter: number
): TurnRules {
  const { worm } = DIFFICULTIES[difficulty];
  if (difficulty === 'easy') {
    if (chapter < EASY_FIRE_CHAPTER) {
      return { fireChance: 0, fireWordMax: 0 };
    }
    return {
      fireChance: Math.min(0.4, 0.15 + 0.05 * (chapter - EASY_FIRE_CHAPTER)),
      fireWordMax: 3,
    };
  }
  return {
    fireChance: Math.min(0.85, worm.fireChance + 0.05 * (chapter - 1)),
    fireWordMax: Math.min(5, worm.fireWordMax + (chapter >= 4 ? 1 : 0)),
  };
}

/** How close the lowest fire tile is to the bottom: 'none', 'watch' or 'danger'. */
export function fireLevel(board: Board): 'none' | 'watch' | 'danger' {
  let lowest = -1;
  board.columns.forEach((col) =>
    col.forEach((t, r) => {
      if (t.fire) {
        lowest = Math.max(lowest, r);
      }
    })
  );
  if (lowest < 0) {
    return 'none';
  }
  return lowest >= board.rows - 3 ? 'danger' : 'watch';
}
