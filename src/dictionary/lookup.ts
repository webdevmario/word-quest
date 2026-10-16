import { KID_DEFINITIONS } from '@/dictionary/kidDefinitions';
import type { PartOfSpeech } from '@/dictionary/kidDefinitions';
import type { CustomDefinition } from '@/game/types';

export interface WordMeaning {
  word: string;
  /** The dictionary form this meaning belongs to, e.g. CAT for CATS. */
  baseWord: string;
  syllables: string | null;
  partOfSpeech: PartOfSpeech | null;
  definition: string;
  example: string | null;
  source: 'kid' | 'parent' | 'online';
}

/** Possible dictionary forms of a word: cats→cat, boxes→box, ran stays ran. */
export function baseForms(word: string): string[] {
  const w = word.toUpperCase();
  const forms = [w];
  const add = (f: string) => {
    if (f.length >= 2 && !forms.includes(f)) {
      forms.push(f);
    }
  };
  if (w.endsWith('IES')) {
    add(`${w.slice(0, -3)}Y`);
  }
  if (w.endsWith('IED')) {
    add(`${w.slice(0, -3)}Y`);
  }
  if (w.endsWith('ES')) {
    add(w.slice(0, -2));
  }
  if (w.endsWith('S') && !w.endsWith('SS')) {
    add(w.slice(0, -1));
  }
  for (const suffix of ['ING', 'ED', 'ER', 'EST']) {
    if (w.endsWith(suffix)) {
      const stem = w.slice(0, -suffix.length);
      add(stem);
      add(`${stem}E`);
      // running → run, hopped → hop
      if (stem.length > 2 && stem.at(-1) === stem.at(-2)) {
        add(stem.slice(0, -1));
      }
    }
  }
  if (w.endsWith('LY')) {
    add(w.slice(0, -2));
  }
  return forms;
}

/** Finds a meaning we already have: parent-written first, then kid-friendly. */
export function localMeaning(
  word: string,
  custom: Record<string, CustomDefinition>
): WordMeaning | null {
  const upper = word.toUpperCase();
  for (const form of baseForms(upper)) {
    const parent = custom[form];
    if (parent) {
      return {
        word: upper,
        baseWord: form,
        syllables: null,
        partOfSpeech: null,
        definition: parent.definition,
        example: parent.example ?? null,
        source: 'parent',
      };
    }
    const kid = KID_DEFINITIONS[form];
    if (kid) {
      return {
        word: upper,
        baseWord: form,
        syllables: kid.syllables,
        partOfSpeech: kid.partOfSpeech,
        definition: kid.definition,
        example: kid.example,
        source: 'kid',
      };
    }
  }
  return null;
}

interface OnlineEntry {
  word?: string;
  meanings?: {
    partOfSpeech?: string;
    definitions?: { definition?: string; example?: string }[];
  }[];
}

const POS = new Set<PartOfSpeech>([
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection',
]); // prettier-ignore

/**
 * Asks the free online dictionary (dictionaryapi.dev) for words we have no
 * saved meaning for. Returns null when offline or the word isn't listed.
 */
export async function onlineMeaning(
  word: string,
  fetcher: typeof fetch = fetch
): Promise<WordMeaning | null> {
  const upper = word.toUpperCase();
  for (const form of baseForms(upper).slice(0, 3)) {
    try {
      const res = await fetcher(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(form.toLowerCase())}`
      );
      if (!res.ok) {
        continue;
      }
      const entries = (await res.json()) as OnlineEntry[];
      for (const entry of entries) {
        for (const meaning of entry.meanings ?? []) {
          // Short definitions read best for kids.
          const def = [...(meaning.definitions ?? [])]
            .filter((d) => d.definition)
            .sort(
              (a, b) =>
                (a.definition?.length ?? 0) - (b.definition?.length ?? 0)
            )[0];
          if (def?.definition) {
            const pos = meaning.partOfSpeech as PartOfSpeech;
            return {
              word: upper,
              baseWord: form,
              syllables: null,
              partOfSpeech: POS.has(pos) ? pos : null,
              definition: def.definition,
              example: def.example ?? null,
              source: 'online',
            };
          }
        }
      }
    } catch {
      return null;
    }
  }
  return null;
}

/** Theme words with a kid definition, used for Word Worm bonus-word clues. */
export function clueFor(word: string): string | null {
  return KID_DEFINITIONS[word.toUpperCase()]?.definition ?? null;
}
