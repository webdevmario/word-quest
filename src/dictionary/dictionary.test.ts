import { readFileSync } from 'node:fs';

import { WordDictionary, loadDictionary } from '@/dictionary/dictionary';

describe('WordDictionary', () => {
  const dict = new WordDictionary(['apple', 'apply', 'cat', 'zebra'], ['cat']);

  it('checks words case-insensitively', () => {
    expect(dict.isWord('CAT')).toBe(true);
    expect(dict.isWord('dog')).toBe(false);
  });

  it('answers prefix questions', () => {
    expect(dict.hasPrefix('APP')).toBe(true);
    expect(dict.hasPrefix('ZEB')).toBe(true);
    expect(dict.hasPrefix('ZZ')).toBe(false);
  });

  it('applies parent overrides', () => {
    const d = new WordDictionary(['cat', 'dog']);
    d.setCustomWords(['GRANDMA'], ['DOG']);
    expect(d.isWord('grandma')).toBe(true);
    expect(d.hasPrefix('gran')).toBe(true);
    expect(d.isWord('dog')).toBe(false);
  });

  it('marks common words', () => {
    expect(dict.isCommon('Cat')).toBe(true);
    expect(dict.isCommon('zebra')).toBe(false);
  });
});

describe('bundled word list', () => {
  const words = readFileSync('public/dict/words.txt', 'utf8').split('\n');
  const dict = new WordDictionary(words);

  it('includes plurals and past tenses kids will make', () => {
    for (const w of ['cats', 'jumped', 'boxes', 'running', 'llama', 'queen']) {
      expect(dict.isWord(w)).toBe(true);
    }
  });

  it('loads through fetch once', async () => {
    let calls = 0;
    const fake = (async (url: string) => {
      calls++;
      const file = String(url).endsWith('common.txt') ? 'common' : 'words';
      return new Response(readFileSync(`public/dict/${file}.txt`, 'utf8'));
    }) as typeof fetch;
    const [a, b] = await Promise.all([
      loadDictionary(fake),
      loadDictionary(fake),
    ]);
    expect(a).toBe(b);
    expect(calls).toBe(2);
    expect(a.size).toBeGreaterThan(100000);
  });
});
