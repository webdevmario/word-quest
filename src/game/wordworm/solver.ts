import { neighbors, samePos, tileAt } from '@/game/wordworm/board';
import type { Board, Pos } from '@/game/wordworm/board';

export interface WordChecker {
  isWord: (word: string) => boolean;
  hasPrefix: (prefix: string) => boolean;
}

export interface FoundWord {
  word: string;
  path: Pos[];
}

/** Every distinct word that can be made on the board right now. */
export function findWords(
  board: Board,
  dict: WordChecker,
  minLength = 3,
  maxLength = 10
): FoundWord[] {
  const results = new Map<string, FoundWord>();

  const visit = (path: Pos[], word: string) => {
    if (word.length >= minLength && !results.has(word) && dict.isWord(word)) {
      results.set(word, { word, path });
    }
    if (word.length >= maxLength) {
      return;
    }
    const last = path[path.length - 1] as Pos;
    for (const next of neighbors(board, last)) {
      if (path.some((p) => samePos(p, next))) {
        continue;
      }
      const extended = word + (tileAt(board, next)?.letter ?? '');
      if (dict.hasPrefix(extended)) {
        visit([...path, next], extended);
      }
    }
  };

  for (let c = 0; c < board.cols; c++) {
    for (let r = 0; r < board.rows; r++) {
      const letter = tileAt(board, { c, r })?.letter ?? '';
      if (dict.hasPrefix(letter)) {
        visit([{ c, r }], letter);
      }
    }
  }
  return [...results.values()];
}

/**
 * Picks a hint: a word kids are likely to know, preferring longer ones but
 * not so long that the hint feels like the game playing itself.
 */
export function pickHint(
  words: FoundWord[],
  isCommon: (word: string) => boolean
): FoundWord | null {
  const ranked = [...words].sort((a, b) => {
    const score = (w: FoundWord) =>
      (isCommon(w.word) ? 10 : 0) + Math.min(w.word.length, 6);
    return score(b) - score(a) || a.word.localeCompare(b.word);
  });
  return ranked[0] ?? null;
}
