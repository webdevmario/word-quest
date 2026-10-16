import { seededRng } from '@/game/random';
import {
  createBoard,
  drawLetter,
  gemForLength,
  isAdjacent,
  neighbors,
  pathWord,
  plantWord,
  scorePath,
  submitPath,
  tileAt,
  toggleInPath,
  tokenize,
} from '@/game/wordworm/board';
import type { Board, Pos, Tile } from '@/game/wordworm/board';

/** Builds a board from rows of letters, e.g. ['CAT', 'DOG']. */
function boardFrom(rows: string[]): Board {
  const cols = rows[0]!.length;
  let id = 1;
  const columns: Tile[][] = Array.from({ length: cols }, (_, c) =>
    rows.map((row) => ({ id: id++, letter: row[c]!, gem: null, fire: false }))
  );
  return { cols, rows: rows.length, columns, nextId: id };
}

const noFire = { fireChance: 0, fireWordMax: 0 };

describe('Word Worm board', () => {
  it('creates a full 7×8 board with sensible vowels', () => {
    const board = createBoard(seededRng(1));
    const tiles = board.columns.flat();
    expect(tiles).toHaveLength(56);
    const vowels = tiles.filter((t) => 'AEIOU'.includes(t.letter)).length;
    expect(vowels / 56).toBeGreaterThan(0.25);
    expect(vowels / 56).toBeLessThan(0.55);
  });

  it('uses staggered-column neighbors', () => {
    const board = createBoard(seededRng(2));
    // Even column: side neighbors at r-1 and r.
    expect(neighbors(board, { c: 2, r: 3 })).toEqual(
      expect.arrayContaining([
        { c: 1, r: 2 },
        { c: 1, r: 3 },
        { c: 3, r: 2 },
        { c: 3, r: 3 },
      ])
    );
    // Odd column: side neighbors at r and r+1.
    expect(isAdjacent(board, { c: 1, r: 3 }, { c: 0, r: 4 })).toBe(true);
    expect(isAdjacent(board, { c: 1, r: 3 }, { c: 0, r: 2 })).toBe(false);
    expect(neighbors(board, { c: 0, r: 0 })).toHaveLength(2);
  });

  it('extends, trims and restarts a selection', () => {
    const board = createBoard(seededRng(3));
    let path: Pos[] = [];
    path = toggleInPath(board, path, { c: 0, r: 0 });
    path = toggleInPath(board, path, { c: 0, r: 1 });
    path = toggleInPath(board, path, { c: 1, r: 1 });
    expect(path).toHaveLength(3);
    path = toggleInPath(board, path, { c: 0, r: 1 });
    expect(path).toEqual([
      { c: 0, r: 0 },
      { c: 0, r: 1 },
    ]);
    path = toggleInPath(board, path, { c: 5, r: 5 });
    expect(path).toEqual([{ c: 5, r: 5 }]);
  });

  it('scores longer words and gems higher', () => {
    const board = boardFrom(['CATS', 'DOGS']);
    const cat = scorePath(
      board,
      [
        { c: 0, r: 0 },
        { c: 1, r: 0 },
        { c: 2, r: 0 },
      ],
      1
    );
    const cats = scorePath(
      board,
      [
        { c: 0, r: 0 },
        { c: 1, r: 0 },
        { c: 2, r: 0 },
        { c: 3, r: 0 },
      ],
      1
    );
    expect(cat.total).toBe(25);
    expect(cats.total).toBeGreaterThan(cat.total);
    board.columns[1]![0]!.gem = 'amber';
    expect(
      scorePath(
        board,
        [
          { c: 0, r: 0 },
          { c: 1, r: 0 },
          { c: 2, r: 0 },
        ],
        1
      ).total
    ).toBe(50);
  });

  it('removes used tiles, drops tiles down and refills from the top', () => {
    const board = boardFrom(['ABC', 'DEF', 'GHI']);
    const below = tileAt(board, { c: 0, r: 2 })!;
    const result = submitPath(
      board,
      [
        { c: 0, r: 0 },
        { c: 0, r: 1 },
      ],
      noFire,
      seededRng(1)
    );
    expect(result.board.columns[0]).toHaveLength(3);
    expect(tileAt(result.board, { c: 0, r: 2 })!.id).toBe(below.id);
    expect(result.gameOver).toBe(false);
  });

  it('spawns a gem for a five-letter word', () => {
    expect(gemForLength(4)).toBeNull();
    expect(gemForLength(5)).toBe('emerald');
    expect(gemForLength(9)).toBe('diamond');
    const board = createBoard(seededRng(4));
    const path: Pos[] = [0, 1, 2, 3, 4].map((r) => ({ c: 0, r }));
    const result = submitPath(board, path, noFire, seededRng(4));
    expect(result.gemSpawned).toBe(gemForLength(pathWord(board, path).length));
    expect(result.board.columns.flat().filter((t) => t.gem)).toHaveLength(1);
  });

  it('burns down one row per turn and ends the game at the bottom', () => {
    const board = boardFrom(['ABC', 'DEF', 'GHI']);
    board.columns[2]![1]!.fire = true;
    const result = submitPath(board, [{ c: 0, r: 0 }], noFire, seededRng(1));
    const fireRow = result.board.columns[2]!.findIndex((t) => t.fire);
    expect(fireRow).toBe(2);
    expect(result.burned).toBe(1);
    expect(result.gameOver).toBe(true);
  });

  it('puts out fire tiles used in a word', () => {
    const board = boardFrom(['ABC', 'DEF', 'GHI']);
    board.columns[0]![0]!.fire = true;
    const result = submitPath(board, [{ c: 0, r: 0 }], noFire, seededRng(1));
    expect(result.firesPutOut).toBe(1);
    expect(result.board.columns.flat().some((t) => t.fire)).toBe(false);
  });

  it('can start a fire after a short word', () => {
    const board = createBoard(seededRng(5));
    const rules = { fireChance: 1, fireWordMax: 3 };
    const path: Pos[] = [0, 1, 2].map((r) => ({ c: 3, r }));
    expect(submitPath(board, path, rules, seededRng(5)).fireSpawned).toBe(true);
  });

  it('plants a word on connected tiles', () => {
    const board = createBoard(seededRng(6));
    const planted = plantWord(board, 'QUEEN', seededRng(6));
    expect(planted).not.toBeNull();
    const tiles = planted!.columns.flat().map((t) => t.letter);
    expect(tiles).toContain('QU');
  });

  it('tokenizes Qu into one tile', () => {
    expect(tokenize('quiet')).toEqual(['QU', 'I', 'E', 'T']);
    expect(tokenize('qat')).toBeNull();
  });

  it('balances vowels when the board runs low or high', () => {
    const rng = seededRng(7);
    expect('AEIOU').toContain(drawLetter(rng, 0.1));
    expect('AEIOU').not.toContain(drawLetter(rng, 0.9));
  });
});
