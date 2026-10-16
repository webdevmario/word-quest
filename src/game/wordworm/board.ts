import { pick, shuffle } from '@/game/random';
import type { Rng } from '@/game/random';
import { SCORING, lengthMultiplier, letterValue } from '@/game/scoring';

/**
 * Word Worm board: columns of tiles where odd columns sit half a tile lower,
 * so every tile touches up to six neighbors (like Bookworm). Tiles are stored
 * column-major with row 0 at the top, which makes gravity a simple prepend.
 */

export const BOARD_COLS = 7;
export const BOARD_ROWS = 8;

export type GemType = 'emerald' | 'amber' | 'sapphire' | 'diamond' | 'crystal';

export const GEM_MULTIPLIER: Record<GemType, number> = {
  emerald: 1.5,
  amber: 2,
  sapphire: 2.5,
  diamond: 3,
  crystal: 4,
};

export interface Tile {
  id: number;
  /** 'A'–'Z', or 'QU' for the two-letter Qu tile. */
  letter: string;
  gem: GemType | null;
  fire: boolean;
}

export interface Board {
  cols: number;
  rows: number;
  /** columns[c][r], r = 0 is the top row. */
  columns: Tile[][];
  nextId: number;
}

export interface Pos {
  c: number;
  r: number;
}

export interface TurnRules {
  fireChance: number;
  fireWordMax: number;
}

export interface TurnResult {
  board: Board;
  gemSpawned: GemType | null;
  fireSpawned: boolean;
  burned: number;
  firesPutOut: number;
  gameOver: boolean;
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/** Relative letter weights, tuned so boards are playable for kids. */
const CONSONANT_WEIGHTS: [string, number][] = [
  ['T', 9], ['N', 7], ['S', 7], ['R', 7], ['L', 5], ['H', 4], ['D', 4],
  ['C', 3.5], ['M', 3], ['P', 3], ['G', 3], ['B', 2.2], ['F', 2], ['Y', 2],
  ['W', 2], ['K', 1.5], ['V', 1], ['X', 0.5], ['J', 0.4], ['QU', 0.5], ['Z', 0.4],
]; // prettier-ignore
const VOWEL_WEIGHTS: [string, number][] = [
  ['E', 12], ['A', 9], ['I', 8], ['O', 8], ['U', 4],
]; // prettier-ignore

function weighted(rng: Rng, table: [string, number][]): string {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [letter, w] of table) {
    roll -= w;
    if (roll < 0) {
      return letter;
    }
  }
  return (table[0] as [string, number])[0];
}

const isVowel = (letter: string) => VOWELS.has(letter);

/** Picks a letter while keeping roughly 38% vowels on the board. */
export function drawLetter(rng: Rng, vowelRatio: number): string {
  if (vowelRatio < 0.3) {
    return weighted(rng, VOWEL_WEIGHTS);
  }
  if (vowelRatio > 0.48) {
    return weighted(rng, CONSONANT_WEIGHTS);
  }
  return rng() < 0.38
    ? weighted(rng, VOWEL_WEIGHTS)
    : weighted(rng, CONSONANT_WEIGHTS);
}

const allTiles = (board: Board) => board.columns.flat();

function vowelRatio(tiles: Tile[]): number {
  return tiles.length
    ? tiles.filter((t) => isVowel(t.letter)).length / tiles.length
    : 0.38;
}

function cloneBoard(board: Board): Board {
  return {
    ...board,
    columns: board.columns.map((col) => col.map((t) => ({ ...t }))),
  };
}

function newTile(board: Board, rng: Rng): Tile {
  return {
    id: board.nextId++,
    letter: drawLetter(rng, vowelRatio(allTiles(board))),
    gem: null,
    fire: false,
  };
}

export function createBoard(
  rng: Rng = Math.random,
  cols = BOARD_COLS,
  rows = BOARD_ROWS
): Board {
  const board: Board = { cols, rows, columns: [], nextId: 1 };
  for (let c = 0; c < cols; c++) {
    board.columns.push([]);
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      (board.columns[c] as Tile[]).push(newTile(board, rng));
    }
  }
  return board;
}

export const tileAt = (board: Board, { c, r }: Pos): Tile | undefined =>
  board.columns[c]?.[r];

/** Neighbors with odd columns shifted half a tile down. */
export function neighbors(board: Board, { c, r }: Pos): Pos[] {
  const side = c % 2 === 0 ? [r - 1, r] : [r, r + 1];
  const candidates: Pos[] = [
    { c, r: r - 1 },
    { c, r: r + 1 },
    ...side.flatMap((sr) => [
      { c: c - 1, r: sr },
      { c: c + 1, r: sr },
    ]),
  ];
  return candidates.filter(
    (p) => p.c >= 0 && p.c < board.cols && p.r >= 0 && p.r < board.rows
  );
}

export const samePos = (a: Pos, b: Pos) => a.c === b.c && a.r === b.r;

export function isAdjacent(board: Board, a: Pos, b: Pos): boolean {
  return neighbors(board, a).some((p) => samePos(p, b));
}

/** The word spelled by a path, e.g. ['QU','I','T'] → 'QUIT'. */
export function pathWord(board: Board, path: Pos[]): string {
  return path.map((p) => tileAt(board, p)?.letter ?? '').join('');
}

/**
 * Updates a selection after a tile is tapped: extends it when the tile is a
 * fresh neighbor, trims back to the tile when it is already selected, or
 * starts a new selection from it.
 */
export function toggleInPath(board: Board, path: Pos[], pos: Pos): Pos[] {
  const index = path.findIndex((p) => samePos(p, pos));
  if (index >= 0) {
    return index === path.length - 1
      ? path.slice(0, -1)
      : path.slice(0, index + 1);
  }
  const last = path[path.length - 1];
  if (!last || isAdjacent(board, last, pos)) {
    return [...path, pos];
  }
  return [pos];
}

export function gemForLength(letters: number): GemType | null {
  if (letters >= 9) {
    return 'crystal';
  }
  if (letters >= 8) {
    return 'diamond';
  }
  if (letters >= 7) {
    return 'sapphire';
  }
  if (letters >= 6) {
    return 'amber';
  }
  if (letters >= 5) {
    return 'emerald';
  }
  return null;
}

export interface WordScore {
  base: number;
  gemMultiplier: number;
  fireBonus: number;
  total: number;
}

/** Points for a path: letter values × length bonus × gems, plus fire bonus. */
export function scorePath(board: Board, path: Pos[], mult: number): WordScore {
  const tiles = path.map((p) => tileAt(board, p)).filter((t): t is Tile => !!t);
  const letters = tiles.reduce((n, t) => n + t.letter.length, 0);
  const value = tiles.reduce((s, t) => s + letterValue(t.letter), 0);
  const base = Math.round(
    value * SCORING.pointsPerLetterValue * lengthMultiplier(letters)
  );
  const gemMultiplier = tiles.reduce(
    (m, t) => (t.gem ? m * GEM_MULTIPLIER[t.gem] : m),
    1
  );
  const fireBonus = tiles.filter((t) => t.fire).length * SCORING.fireOutBonus;
  const total = Math.round((base * gemMultiplier + fireBonus) * mult);
  return { base, gemMultiplier, fireBonus, total };
}

/** Removes the word's tiles, drops new ones in, then lets fire burn. */
export function submitPath(
  board: Board,
  path: Pos[],
  rules: TurnRules,
  rng: Rng = Math.random
): TurnResult {
  const next = cloneBoard(board);
  const used = path.map((p) => tileAt(board, p)).filter((t): t is Tile => !!t);
  const usedIds = new Set(used.map((t) => t.id));
  const letters = used.reduce((n, t) => n + t.letter.length, 0);
  const firesPutOut = used.filter((t) => t.fire).length;
  const survivingFires = allTiles(next)
    .filter((t) => t.fire && !usedIds.has(t.id))
    .map((t) => t.id);

  // Gravity: keep unused tiles in order, new tiles fall in from the top.
  const fresh: Tile[] = [];
  next.columns = next.columns.map((col) => {
    const kept = col.filter((t) => !usedIds.has(t.id));
    const added: Tile[] = [];
    while (kept.length + added.length < next.rows) {
      const tile = newTile(next, rng);
      added.push(tile);
      fresh.push(tile);
    }
    return [...added, ...kept];
  });

  // Each fire that was already on the board burns the tile beneath it.
  let burned = 0;
  for (const id of survivingFires) {
    const col = next.columns.find((cl) => cl.some((t) => t.id === id));
    if (!col) {
      continue;
    }
    const r = col.findIndex((t) => t.id === id);
    if (r < next.rows - 1) {
      col.splice(r + 1, 1);
      const tile = newTile(next, rng);
      col.unshift(tile);
      fresh.push(tile);
      burned++;
    }
  }

  const gemSpawned = gemForLength(letters);
  if (gemSpawned && fresh.length) {
    pick(rng, fresh).gem = gemSpawned;
  }

  let fireSpawned = false;
  if (
    rules.fireChance > 0 &&
    letters <= rules.fireWordMax &&
    rng() < rules.fireChance
  ) {
    const options = fresh.filter((t) => !t.gem);
    if (options.length) {
      pick(rng, options).fire = true;
      fireSpawned = true;
    }
  }

  const gameOver = next.columns.some(
    (col) => col[next.rows - 1]?.fire === true
  );
  return {
    board: next,
    gemSpawned,
    fireSpawned,
    burned,
    firesPutOut,
    gameOver,
  };
}

/** Rerolls every letter except fire tiles. Gems keep their sparkle. */
export function shuffleBoard(board: Board, rng: Rng = Math.random): Board {
  const next = cloneBoard(board);
  next.columns = next.columns.map((col) =>
    col.map((t) => (t.fire ? t : { ...newTile(next, rng), gem: t.gem }))
  );
  return next;
}

/** Splits a word into tile letters, merging QU. Null if a Q has no U. */
export function tokenize(word: string): string[] | null {
  const upper = word.toUpperCase();
  const tiles: string[] = [];
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i] as string;
    if (ch === 'Q') {
      if (upper[i + 1] !== 'U') {
        return null;
      }
      tiles.push('QU');
      i++;
    } else {
      tiles.push(ch);
    }
  }
  return tiles;
}

/**
 * Writes a word onto a random connected path of plain tiles, so the bonus
 * word is always possible to make. Returns null if it cannot fit.
 */
export function plantWord(
  board: Board,
  word: string,
  rng: Rng = Math.random
): Board | null {
  const tokens = tokenize(word);
  if (!tokens || !tokens.length) {
    return null;
  }
  const usable = (p: Pos) => {
    const t = tileAt(board, p);
    return !!t && !t.fire && !t.gem;
  };

  const walk = (path: Pos[]): Pos[] | null => {
    if (path.length === tokens.length) {
      return path;
    }
    const last = path[path.length - 1] as Pos;
    const options = shuffle(
      rng,
      neighbors(board, last).filter(
        (p) => usable(p) && !path.some((q) => samePos(q, p))
      )
    );
    for (const p of options) {
      const found = walk([...path, p]);
      if (found) {
        return found;
      }
    }
    return null;
  };

  const starts: Pos[] = [];
  for (let c = 0; c < board.cols; c++) {
    for (let r = 0; r < board.rows; r++) {
      if (usable({ c, r })) {
        starts.push({ c, r });
      }
    }
  }
  for (const start of shuffle(rng, starts).slice(0, 12)) {
    const path = walk([start]);
    if (path) {
      const next = cloneBoard(board);
      path.forEach((p, i) => {
        const tile = tileAt(next, p) as Tile;
        tile.letter = tokens[i] as string;
        tile.id = next.nextId++;
      });
      return next;
    }
  }
  return null;
}
