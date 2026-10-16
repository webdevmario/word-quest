import { ArrowLeft, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useNav } from '@/app/nav';
import { useCurrentProfile } from '@/app/useCurrentProfile';
import { Button } from '@/components/ui/Button';
import { localMeaning } from '@/dictionary/lookup';
import { useAppData } from '@/store/appStore';

type Sort = 'abc' | 'recent';

/** Every word this player has found, like a personal dictionary. */
export function WordBookScreen() {
  const { go, openCard } = useNav();
  const profile = useCurrentProfile();
  const custom = useAppData((d) => d.custom.definitions);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('abc');

  const entries = useMemo(() => {
    const all = Object.entries(profile?.wordBook ?? {});
    const q = query.trim().toUpperCase();
    return all
      .filter(([w]) => !q || w.includes(q))
      .sort(([a, ea], [b, eb]) =>
        sort === 'abc' ? a.localeCompare(b) : eb.firstFound - ea.firstFound
      );
  }, [profile?.wordBook, query, sort]);

  if (!profile) {
    return null;
  }
  const total = Object.keys(profile.wordBook).length;

  // Group alphabetically like a real dictionary.
  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const letter = sort === 'abc' ? (entry[0][0] ?? '#') : 'Newest first';
    groups.set(letter, [...(groups.get(letter) ?? []), entry]);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pt-4 pb-16">
      <Button variant="ghost" size="sm" onClick={() => go('setup')}>
        <ArrowLeft className="size-4" aria-hidden /> Back
      </Button>

      <header className="mt-4">
        <h1 className="font-display text-4xl font-semibold text-parchment-50">
          {profile.name}’s Word Book
        </h1>
        <p className="mt-1 text-parchment-300">
          {total
            ? `${total.toLocaleString()} words collected. Tap a word to hear it and learn what it means.`
            : 'Words you find in either game are saved here.'}
        </p>
      </header>

      {total > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="relative flex-1">
            <span className="sr-only">Search your words</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-soft"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your words"
              className="h-12 w-full rounded-2xl bg-parchment-100 pr-4 pl-10 text-ink outline-none focus:ring-4 focus:ring-gilt-300/60"
            />
          </label>
          <div
            className="flex rounded-2xl bg-black/25 p-1"
            role="radiogroup"
            aria-label="Sort words"
          >
            {(
              [
                ['abc', 'A to Z'],
                ['recent', 'Newest'],
              ] as [Sort, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={sort === value}
                onClick={() => setSort(value)}
                className={
                  sort === value
                    ? 'rounded-xl bg-gilt-300 px-4 py-2 font-bold text-ink'
                    : 'rounded-xl px-4 py-2 font-bold text-parchment-200'
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {[...groups.entries()].map(([letter, items]) => (
        <section key={letter} className="mt-8">
          <h2 className="gilt-text font-display text-3xl font-semibold">
            {letter}
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {items.map(([word, entry]) => {
              const meaning = localMeaning(word, custom);
              return (
                <li key={word}>
                  <button
                    type="button"
                    onClick={() => openCard(word)}
                    className="paper w-full rounded-2xl px-4 py-3 text-left transition hover:-translate-y-0.5"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-xl font-semibold">
                        {word.charAt(0) + word.slice(1).toLowerCase()}
                      </span>
                      {entry.count > 1 && (
                        <span className="text-xs font-bold text-ink-soft">
                          found {entry.count}×
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-ink-soft">
                      {meaning?.definition ?? 'Tap to look it up'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
