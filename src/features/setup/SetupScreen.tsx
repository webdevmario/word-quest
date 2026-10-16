import clsx from 'clsx';
import { ArrowLeft, BookOpen, Check, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

import { useNav } from '@/app/nav';
import { useCurrentProfile } from '@/app/useCurrentProfile';
import { InkyArt } from '@/components/Mascot';
import { PlayerBanner } from '@/components/PlayerBanner';
import { Button } from '@/components/ui/Button';
import { allThemes } from '@/game/catalog';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '@/game/difficulty';
import { MIX_THEME } from '@/game/themes';
import type { GameMode } from '@/game/types';
import { GUESS_RULES, todayKey } from '@/game/wordguess/guess';
import { setPrefs } from '@/store/actions';
import { useAppData } from '@/store/appStore';

import type { ReactNode } from 'react';

const START_LABELS: Record<GameMode, string> = {
  search: 'Start Word Search',
  worm: 'Start Word Worm',
  guess: 'Start Word Guess',
};

function MiniGuess() {
  const colors = ['#2eb872', '#5e4a3a', '#e8a12a', '#2eb872', '#5e4a3a'];
  return (
    <div className="flex gap-0.5" aria-hidden>
      {[...'GUESS'].map((ch, i) => (
        <span
          key={i}
          className="tile size-6 text-xs"
          data-found=""
          style={{ ['--found' as string]: colors[i] }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

function ModeCard({
  selected,
  onSelect,
  title,
  blurb,
  art,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  blurb: string;
  art: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'relative flex items-center gap-4 overflow-hidden rounded-[24px] p-4 text-left transition sm:flex-col sm:items-start sm:gap-3',
        selected
          ? 'paper ring-4 ring-gilt-300'
          : 'bg-black/20 text-parchment-100 ring-1 ring-white/10 hover:bg-black/30'
      )}
    >
      <div className="shrink-0">{art}</div>
      <div>
        <h3 className="font-display text-2xl font-semibold">{title}</h3>
        <p
          className={clsx(
            'text-sm',
            selected ? 'text-ink-soft' : 'text-parchment-300'
          )}
        >
          {blurb}
        </p>
      </div>
      {selected && (
        <Check
          className="absolute top-3 right-3 size-5 text-gilt-700"
          aria-hidden
        />
      )}
    </motion.button>
  );
}

function MiniGrid() {
  const letters = 'CATQPOWLSUNRAFOX';
  return (
    <div className="grid grid-cols-4 gap-1" aria-hidden>
      {[...letters].map((ch, i) => (
        <span
          key={i}
          className="tile size-5 text-[11px]"
          data-found={[0, 1, 2].includes(i) ? '' : undefined}
          style={{ ['--found' as string]: '#2eb872' }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

export function SetupScreen() {
  const { go } = useNav();
  const profile = useCurrentProfile();
  const customLists = useAppData((d) => d.custom.lists);

  if (!profile) {
    return null;
  }
  const { mode, difficulty, theme } = profile.prefs;
  const update = (prefs: Parameters<typeof setPrefs>[1]) =>
    setPrefs(profile.id, prefs);
  const themes = allThemes(customLists);
  const level = DIFFICULTIES[difficulty];
  const dailyDone = profile.stats.dailyPlayed === todayKey();

  return (
    <main className="mx-auto max-w-4xl px-4 pt-4 pb-28">
      <nav className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => go('home', { profileId: null })}
        >
          <ArrowLeft className="size-4" aria-hidden /> Players
        </Button>
        <div className="flex gap-2">
          <Button variant="wood" size="sm" onClick={() => go('wordbook')}>
            <BookOpen className="size-4" aria-hidden /> Word Book
          </Button>
          <Button variant="wood" size="sm" onClick={() => go('trophies')}>
            <Trophy className="size-4" aria-hidden /> Trophies
          </Button>
        </div>
      </nav>

      <PlayerBanner
        profile={profile}
        onEdit={() => go('editor', { editingId: profile.id })}
      />

      <h2 className="mt-8 mb-3 font-display text-2xl text-parchment-100">
        What do you want to play?
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            [
              'search',
              'Word Search',
              'Find the hidden words from a theme.',
              <MiniGrid key="g" />,
            ],
            [
              'worm',
              'Word Worm',
              'Link letter tiles to make any word you know.',
              <div key="w" className="size-16">
                <InkyArt mood="idle" />
              </div>,
            ],
            [
              'guess',
              'Word Guess',
              'Guess the secret word. Colors give you clues.',
              <MiniGuess key="q" />,
            ],
          ] as [GameMode, string, string, ReactNode][]
        ).map(([m, title, blurb, art]) => (
          <ModeCard
            key={m}
            selected={mode === m}
            onSelect={() => update({ mode: m })}
            title={title}
            blurb={blurb}
            art={art}
          />
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-display text-2xl text-parchment-100">
        How tricky?
      </h2>
      <div
        className="grid grid-cols-2 gap-2 rounded-[24px] bg-black/25 p-2 sm:grid-cols-4"
        role="radiogroup"
        aria-label="Difficulty"
      >
        {DIFFICULTY_ORDER.map((key) => {
          const d = DIFFICULTIES[key];
          const active = key === difficulty;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => update({ difficulty: key })}
              className={clsx(
                'relative rounded-[18px] px-3 py-3 text-center transition',
                active ? 'text-ink' : 'text-parchment-200 hover:bg-white/5'
              )}
            >
              {active && (
                <motion.span
                  layoutId="level-pill"
                  className="absolute inset-0 rounded-[18px] bg-gradient-to-b from-gilt-200 to-gilt-400 shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative block text-2xl" aria-hidden>
                {d.icon}
              </span>
              <span className="relative block font-display text-lg font-semibold">
                {d.name}
              </span>
              <span className="relative block text-xs font-bold opacity-80">
                ×{d.mult} points
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 px-2 text-parchment-300">
        {mode === 'search'
          ? level.search.blurb
          : mode === 'worm'
            ? level.worm.blurb
            : GUESS_RULES[difficulty].blurb}
      </p>

      {mode === 'guess' && (
        <>
          <h2 className="mt-8 mb-3 font-display text-2xl text-parchment-100">
            Which word?
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                [
                  true,
                  '📅 Word of the day',
                  dailyDone
                    ? 'Done for today. Come back tomorrow!'
                    : 'A new secret word every day.',
                ],
                [false, '🎲 Practice words', 'Play as many as you like.'],
              ] as [boolean, string, string][]
            ).map(([daily, title, help]) => {
              const active = profile.prefs.guessDaily === daily;
              return (
                <button
                  key={title}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ guessDaily: daily })}
                  className={clsx(
                    'rounded-2xl px-4 py-3 text-left transition',
                    active
                      ? 'paper ring-2 ring-gilt-400'
                      : 'bg-black/20 text-parchment-100 hover:bg-black/30'
                  )}
                >
                  <span className="block font-bold">{title}</span>
                  <span
                    className={clsx(
                      'text-sm',
                      active ? 'text-ink-soft' : 'text-parchment-300'
                    )}
                  >
                    {help}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === 'search' && (
        <>
          <h2 className="mt-8 mb-3 font-display text-2xl text-parchment-100">
            Pick a theme
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[...themes, { ...MIX_THEME, words: [] }].map((t) => {
              const active = t.id === theme;
              const done = profile.stats.themesCompleted.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ theme: t.id })}
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition',
                    active
                      ? 'paper ring-2 ring-gilt-400'
                      : 'bg-black/20 text-parchment-100 hover:bg-black/30'
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {t.icon}
                  </span>
                  <span className="flex-1">{t.name}</span>
                  {done && (
                    <span
                      className="grid size-6 place-items-center rounded-full bg-emerald text-white"
                      title="Finished before"
                    >
                      <Check className="size-4" aria-label="Finished before" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-felt-950 via-felt-950/90 to-transparent px-4 pt-8 pb-5">
        <div className="mx-auto max-w-md">
          <Button
            variant="gilt"
            size="lg"
            className="w-full"
            onClick={() => go(mode)}
          >
            {START_LABELS[mode]}
          </Button>
        </div>
      </div>
    </main>
  );
}
