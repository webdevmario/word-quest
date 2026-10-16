/** A function returning a float in [0, 1). Pass a seeded one in tests. */
export type Rng = () => number;

/** Small, fast seeded generator (mulberry32). */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (rng: Rng, n: number) => Math.floor(rng() * n);

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (!items.length) {
    throw new Error('pick() called with an empty list');
  }
  return items[randInt(rng, items.length)] as T;
}

export function shuffle<T>(rng: Rng, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [items[i], items[j]] = [items[j] as T, items[i] as T];
  }
  return items;
}
