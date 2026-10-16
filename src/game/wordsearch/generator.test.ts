import { DIFFICULTIES, DIFFICULTY_ORDER } from '@/game/difficulty';
import { seededRng } from '@/game/random';
import { BUILT_IN_THEMES } from '@/game/themes';
import {
  generatePuzzle,
  isBackwards,
  isDiagonal,
} from '@/game/wordsearch/generator';

const spell = (
  grid: string[][],
  cells: readonly (readonly [number, number])[]
) => cells.map(([r, c]) => grid[r]?.[c]).join('');

describe('generatePuzzle', () => {
  it.each(DIFFICULTY_ORDER)('places every word correctly on %s', (level) => {
    for (const theme of BUILT_IN_THEMES) {
      for (let seed = 1; seed <= 15; seed++) {
        const puzzle = generatePuzzle(
          theme.words,
          level,
          theme.id,
          seededRng(seed)
        );
        const { size, count } = DIFFICULTIES[level].search;
        expect(puzzle.grid).toHaveLength(size);
        expect(puzzle.words.length).toBe(count);
        for (const word of puzzle.words) {
          expect(spell(puzzle.grid, word.cells)).toBe(word.text);
        }
      }
    }
  });

  it('only uses allowed directions', () => {
    const puzzle = generatePuzzle(
      BUILT_IN_THEMES[0]!.words,
      'easy',
      'animals',
      seededRng(3)
    );
    for (const word of puzzle.words) {
      expect(isBackwards(word.dir)).toBe(false);
      expect(isDiagonal(word.dir)).toBe(false);
    }
  });

  it('marks exactly one golden word worth double', () => {
    const puzzle = generatePuzzle(
      BUILT_IN_THEMES[1]!.words,
      'medium',
      'ocean',
      seededRng(9)
    );
    expect(puzzle.words.filter((w) => w.golden)).toHaveLength(1);
  });

  it('never pairs words that contain each other', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { words } = generatePuzzle(
        BUILT_IN_THEMES[3]!.words,
        'hard',
        'food',
        seededRng(seed)
      );
      for (const a of words) {
        for (const b of words) {
          if (a !== b) {
            expect(a.text.includes(b.text)).toBe(false);
          }
        }
      }
    }
  });

  it('copes with a tiny custom list', () => {
    const puzzle = generatePuzzle(
      ['cat', 'dog'],
      'easy',
      'custom',
      seededRng(1)
    );
    expect(puzzle.words.map((w) => w.text).sort()).toEqual(['CAT', 'DOG']);
  });
});
