import { WordDictionary } from '@/dictionary/dictionary';
import type { Board, Tile } from '@/game/wordworm/board';
import { findWords, pickHint } from '@/game/wordworm/solver';

function boardFrom(rows: string[]): Board {
  let id = 1;
  const cols = rows[0]!.length;
  const columns: Tile[][] = Array.from({ length: cols }, (_, c) =>
    rows.map((row) => ({ id: id++, letter: row[c]!, gem: null, fire: false }))
  );
  return { cols, rows: rows.length, columns, nextId: id };
}

describe('solver', () => {
  const dict = new WordDictionary(['cat', 'cats', 'act', 'at', 'tac'], ['cat']);

  it('finds words along connected tiles', () => {
    // Column 0: C,A  Column 1: T,S  (odd column is shifted down)
    const board = boardFrom(['CT', 'AS']);
    const words = findWords(board, dict).map((w) => w.word);
    expect(words).toEqual(expect.arrayContaining(['CAT', 'ACT']));
    expect(words).not.toContain('AT'); // shorter than 3
  });

  it('prefers common words for hints', () => {
    const hint = pickHint(
      [
        { word: 'TAC', path: [] },
        { word: 'CAT', path: [] },
      ],
      (w) => dict.isCommon(w)
    );
    expect(hint?.word).toBe('CAT');
  });
});
