/**
 * The word list behind Word Worm. Words are checked against a sorted list so
 * prefix lookups (used by hints) are a binary search, not a scan.
 */
export class WordDictionary {
  private readonly sorted: string[];
  private readonly all: Set<string>;
  private readonly common: Set<string>;
  private allowed = new Set<string>();
  private blocked = new Set<string>();

  constructor(words: string[], common: string[] = []) {
    this.sorted = words
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
      .sort();
    this.all = new Set(this.sorted);
    this.common = new Set(common.map((w) => w.trim().toLowerCase()));
  }

  get size() {
    return this.all.size;
  }

  /** Parent overrides from the Word Lists screen. */
  setCustomWords(allowed: string[], blocked: string[]) {
    this.allowed = new Set(allowed.map((w) => w.toLowerCase()));
    this.blocked = new Set(blocked.map((w) => w.toLowerCase()));
  }

  isWord(word: string): boolean {
    const w = word.toLowerCase();
    if (this.blocked.has(w)) {
      return false;
    }
    return this.allowed.has(w) || this.all.has(w);
  }

  isCommon(word: string): boolean {
    return this.common.has(word.toLowerCase());
  }

  hasPrefix(prefix: string): boolean {
    const p = prefix.toLowerCase();
    let lo = 0;
    let hi = this.sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((this.sorted[mid] as string) < p) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    if (this.sorted[lo]?.startsWith(p)) {
      return true;
    }
    for (const w of this.allowed) {
      if (w.startsWith(p)) {
        return true;
      }
    }
    return false;
  }
}

const splitLines = (text: string) => text.split('\n').filter(Boolean);

let loading: Promise<WordDictionary> | null = null;

/** Loads the bundled word lists once (about 1.7 MB, cached by the browser). */
export function loadDictionary(
  fetcher: typeof fetch = fetch
): Promise<WordDictionary> {
  loading ??= (async () => {
    const base = import.meta.env.BASE_URL;
    const [words, common] = await Promise.all(
      ['dict/words.txt', 'dict/common.txt'].map(async (file) => {
        const res = await fetcher(base + file);
        if (!res.ok) {
          throw new Error(`Could not load ${file} (${res.status})`);
        }
        return splitLines(await res.text());
      })
    );
    return new WordDictionary(words ?? [], common ?? []);
  })().catch((err: unknown) => {
    loading = null;
    throw err;
  });
  return loading;
}
