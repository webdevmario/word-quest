export interface ParsedLine {
  word: string;
  definition: string | null;
}

export interface ParsedList {
  entries: ParsedLine[];
  /** Lines that couldn't be used, with the reason. */
  problems: { line: string; reason: string }[];
}

/**
 * Reads a pasted word list: one word per line, optionally followed by a dash
 * or colon and a meaning, e.g. "planet - a big ball that goes around a star".
 */
export function parseWordList(text: string): ParsedList {
  const entries: ParsedLine[] = [];
  const problems: ParsedList['problems'] = [];
  const seen = new Set<string>();

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) {
      continue;
    }
    const match = /^([^\s:–—-]+)\s*(?:[:–—-]\s*(.*))?$/.exec(line);
    const word = (match?.[1] ?? '').toUpperCase();
    if (!/^[A-Z]+$/.test(word)) {
      problems.push({ line, reason: 'Use letters only, one word per line' });
      continue;
    }
    if (word.length < 3 || word.length > 12) {
      problems.push({ line, reason: 'Words need 3 to 12 letters' });
      continue;
    }
    if (seen.has(word)) {
      continue;
    }
    seen.add(word);
    const definition = match?.[2]?.trim() || null;
    entries.push({ word, definition });
  }
  return { entries, problems };
}

/** Splits a box of words separated by commas, spaces or new lines. */
export function parseWordSet(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\s,]+/)
        .map((w) => w.trim().toUpperCase())
        .filter((w) => /^[A-Z]{2,15}$/.test(w))
    ),
  ];
}
