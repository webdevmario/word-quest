import type { Cell, PlacedWord } from '@/game/wordsearch/generator';

export const sameCell = (a: Cell | null, b: Cell | null) =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1];

/** True when two cells sit on one straight line (row, column or diagonal). */
export function isAligned(a: Cell, b: Cell): boolean {
  const dr = b[0] - a[0];
  const dc = b[1] - a[1];
  return dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
}

/** Every cell from a to b inclusive. Assumes they are aligned. */
export function lineCells(a: Cell, b: Cell): Cell[] {
  const dr = Math.sign(b[0] - a[0]);
  const dc = Math.sign(b[1] - a[1]);
  const len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  return Array.from(
    { length: len + 1 },
    (_, i) => [a[0] + dr * i, a[1] + dc * i] as const
  );
}

/** Snaps a free-hand drag to the nearest of the 8 directions, kept on the grid. */
export function snapEnd(start: Cell, raw: Cell, size: number): Cell {
  const dr = raw[0] - start[0];
  const dc = raw[1] - start[1];
  if (!dr && !dc) {
    return start;
  }
  const step = Math.round(Math.atan2(dr, dc) / (Math.PI / 4));
  const ur = Math.round(Math.sin((step * Math.PI) / 4));
  const uc = Math.round(Math.cos((step * Math.PI) / 4));
  let len =
    ur && uc
      ? Math.round((Math.abs(dr) + Math.abs(dc)) / 2)
      : Math.max(Math.abs(dr), Math.abs(dc));
  while (len > 0) {
    const r = start[0] + ur * len;
    const c = start[1] + uc * len;
    if (r >= 0 && r < size && c >= 0 && c < size) {
      break;
    }
    len--;
  }
  return [start[0] + ur * len, start[1] + uc * len];
}

/** Finds an unfound word spelled by the cells, forwards or backwards. */
export function matchWord(
  grid: string[][],
  cells: Cell[],
  words: PlacedWord[],
  found: ReadonlySet<string>
): PlacedWord | null {
  if (cells.length < 2) {
    return null;
  }
  const text = cells.map(([r, c]) => grid[r]?.[c] ?? '').join('');
  const reversed = [...text].reverse().join('');
  return (
    words.find(
      (w) => !found.has(w.text) && (w.text === text || w.text === reversed)
    ) ?? null
  );
}
