import type { PlacedWord } from '@/game/wordsearch/generator';
import {
  isAligned,
  lineCells,
  matchWord,
  sameCell,
  snapEnd,
} from '@/game/wordsearch/selection';

describe('selection helpers', () => {
  it('detects aligned cells', () => {
    expect(isAligned([0, 0], [0, 5])).toBe(true);
    expect(isAligned([0, 0], [4, 4])).toBe(true);
    expect(isAligned([0, 0], [2, 5])).toBe(false);
  });

  it('lists cells along a line', () => {
    expect(lineCells([2, 2], [0, 0])).toEqual([
      [2, 2],
      [1, 1],
      [0, 0],
    ]);
  });

  it('snaps a wobbly drag to the nearest direction', () => {
    expect(snapEnd([0, 0], [1, 5], 8)).toEqual([0, 5]);
    expect(snapEnd([0, 0], [3, 4], 8)).toEqual([4, 4]);
    expect(snapEnd([7, 0], [0, 7], 8)).toEqual([0, 7]);
  });

  it('keeps snapped drags on the grid', () => {
    expect(snapEnd([6, 6], [9, 9], 8)).toEqual([7, 7]);
  });

  it('matches words forwards and backwards, once', () => {
    const grid = [['C', 'A', 'T']];
    const word: PlacedWord = {
      text: 'CAT',
      cells: [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
      dir: [0, 1],
      value: 25,
      golden: false,
    };
    const forward = lineCells([0, 0], [0, 2]);
    const backward = lineCells([0, 2], [0, 0]);
    expect(matchWord(grid, forward, [word], new Set())).toBe(word);
    expect(matchWord(grid, backward, [word], new Set())).toBe(word);
    expect(matchWord(grid, forward, [word], new Set(['CAT']))).toBeNull();
    expect(sameCell([1, 1], [1, 1])).toBe(true);
  });
});
