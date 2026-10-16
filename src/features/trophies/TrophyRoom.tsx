import clsx from 'clsx';
import { ArrowLeft } from 'lucide-react';

import { useNav } from '@/app/nav';
import { useCurrentProfile } from '@/app/useCurrentProfile';
import { formatTime } from '@/components/GameHud';
import { PlayerBanner } from '@/components/PlayerBanner';
import { Button } from '@/components/ui/Button';
import { BADGES, TITLES, titleFor } from '@/game/progression';
import type { BadgeGroup } from '@/game/progression';

// A Record so a new badge group can't be left off the shelf.
const GROUP_LABELS: Record<BadgeGroup, string> = {
  search: 'Word Search',
  worm: 'Word Worm',
  guess: 'Word Guess',
  learning: 'Learning',
  milestone: 'Milestones',
};
const GROUPS = Object.entries(GROUP_LABELS) as [BadgeGroup, string][];

export function TrophyRoom() {
  const { go } = useNav();
  const profile = useCurrentProfile();
  if (!profile) {
    return null;
  }
  const s = profile.stats;
  const current = titleFor(profile.points);
  const earned = Object.keys(profile.badges).length;

  const tiles: [string, string][] = [
    [
      'Words in Word Book',
      Object.keys(profile.wordBook).length.toLocaleString(),
    ],
    ['Word searches finished', s.puzzlesCompleted.toLocaleString()],
    ['Word Worm words', s.wormWords.toLocaleString()],
    ['Best Word Worm game', s.wormBestGame.toLocaleString()],
    ['Longest word', String(Math.max(s.longestWord, s.wormLongest))],
    ['Fastest puzzle', s.fastest === null ? '—' : formatTime(s.fastest)],
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 pt-4 pb-16">
      <Button variant="ghost" size="sm" onClick={() => go('setup')}>
        <ArrowLeft className="size-4" aria-hidden /> Back
      </Button>
      <div className="mt-3">
        <PlayerBanner profile={profile} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-black/20 px-4 py-3">
            <dt className="text-sm text-parchment-300">{label}</dt>
            <dd className="font-display text-3xl font-semibold text-parchment-50 tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-parchment-100">Titles</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {TITLES.map((t) => {
            const got = profile.points >= t.min;
            const here = t === current;
            return (
              <li
                key={t.name}
                className={clsx(
                  'flex items-center gap-3 rounded-2xl px-4 py-2.5',
                  here
                    ? 'paper'
                    : got
                      ? 'bg-black/25 text-parchment-100'
                      : 'text-parchment-300/60'
                )}
              >
                <span
                  className={clsx('text-2xl', !got && 'opacity-40 grayscale')}
                  aria-hidden
                >
                  {t.icon}
                </span>
                <span className="flex-1 font-display text-lg font-semibold">
                  {t.name}
                </span>
                <span className="text-sm font-bold">
                  {here ? 'You are here' : `${t.min.toLocaleString()} points`}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-parchment-100">
          Badges{' '}
          <span className="text-lg text-parchment-300">
            {earned} of {BADGES.length}
          </span>
        </h2>
        {GROUPS.map(([group, label]) => (
          <div key={group} className="mt-5">
            <h3 className="mb-2 font-bold text-gilt-300">{label}</h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {BADGES.filter((b) => b.group === group).map((b) => {
                const at = profile.badges[b.id];
                return (
                  <li
                    key={b.id}
                    className={clsx(
                      'flex flex-col items-center rounded-2xl p-3 text-center',
                      at
                        ? 'paper'
                        : 'border border-dashed border-parchment-300/25 text-parchment-300'
                    )}
                  >
                    <span
                      className={clsx(
                        'grid size-14 place-items-center rounded-full text-3xl',
                        at
                          ? 'bg-gradient-to-b from-gilt-200 to-gilt-500 shadow-md'
                          : 'bg-black/25 opacity-50 grayscale'
                      )}
                      aria-hidden
                    >
                      {b.icon}
                    </span>
                    <span className="mt-2 font-bold">{b.name}</span>
                    <span
                      className={clsx('text-sm', at ? 'text-ink-soft' : '')}
                    >
                      {b.description}
                    </span>
                    {at && (
                      <span className="mt-1 text-xs text-ink-soft">
                        Earned {new Date(at).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
