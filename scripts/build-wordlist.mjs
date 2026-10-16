// Rebuilds public/dict/words.txt and common.txt from their public sources.
// Run with: npm run words:build
//
// - ENABLE word list (public domain) for checking Word Worm words.
// - google-10000-english (no swears) to prefer common words for hints.
// - LDNOOBW English list to remove rude words (and their simple forms).
import { mkdir, writeFile } from 'node:fs/promises';

const SOURCES = {
  enable:
    'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt',
  common:
    'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt',
  blocked:
    'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en',
};

const lines = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${url} → ${res.status}`);
  }
  return (await res.text()).split('\n').map((l) => l.trim().toLowerCase());
};

const ok = (w) => /^[a-z]{3,15}$/.test(w);

const [enable, common, blockedRaw] = await Promise.all(
  Object.values(SOURCES).map(lines)
);

const blocked = new Set();
for (const w of blockedRaw.filter((x) => /^[a-z]{3,}$/.test(x))) {
  for (const suffix of ['', 's', 'es', 'ed', 'er', 'ers', 'ing', 'y']) {
    blocked.add(w + suffix);
  }
}

const words = [...new Set(enable.filter(ok))]
  .filter((w) => !blocked.has(w))
  .sort();
const wordSet = new Set(words);
const commonWords = common.filter((w) => ok(w) && wordSet.has(w));

await mkdir('public/dict', { recursive: true });
await writeFile('public/dict/words.txt', `${words.join('\n')}\n`);
await writeFile('public/dict/common.txt', `${commonWords.join('\n')}\n`);
console.log(`words: ${words.length}, common: ${commonWords.length}`);
