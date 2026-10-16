import { seededRng } from '@/game/random';
import { createBoard } from '@/game/wordworm/board';
import { EASY_FIRE_CHAPTER, fireLevel, fireRules } from '@/game/wordworm/rules';

describe('fireRules', () => {
  it('keeps Easy fire-free at first', () => {
    expect(fireRules('easy', 1).fireChance).toBe(0);
    expect(fireRules('easy', EASY_FIRE_CHAPTER).fireChance).toBeGreaterThan(0);
  });

  it('gets hotter each chapter, with a cap', () => {
    const early = fireRules('medium', 1).fireChance;
    const later = fireRules('medium', 4).fireChance;
    expect(later).toBeGreaterThan(early);
    expect(fireRules('expert', 50).fireChance).toBe(0.85);
    expect(fireRules('hard', 5).fireWordMax).toBe(5);
  });
});

describe('fireLevel', () => {
  it('warns when fire gets near the bottom', () => {
    const board = createBoard(seededRng(1));
    expect(fireLevel(board)).toBe('none');
    board.columns[2]![1]!.fire = true;
    expect(fireLevel(board)).toBe('watch');
    board.columns[4]![6]!.fire = true;
    expect(fireLevel(board)).toBe('danger');
  });
});
