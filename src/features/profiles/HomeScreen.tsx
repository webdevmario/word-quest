import clsx from 'clsx';
import { Plus, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';

import { useNav } from '@/app/nav';
import { BookCover } from '@/components/BookCover';
import { Logo } from '@/components/Logo';
import { InkyArt } from '@/components/Mascot';
import { titleFor } from '@/game/progression';
import { useAppData } from '@/store/appStore';

import type { ReactNode } from 'react';

const MAX_PLAYERS = 6;
const LIFT = { lift: { y: -10, rotate: -2 }, press: { scale: 0.96 } };

/** One stretch of shelf; neighboring slots join into a continuous plank. */
function ShelfSlot({
  children,
  delay,
  className,
  decorative,
}: {
  children: ReactNode;
  delay: number;
  className?: string;
  decorative?: boolean;
}) {
  return (
    <motion.div
      className={clsx('flex w-52 flex-col items-center', className)}
      aria-hidden={decorative || undefined}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function Plank() {
  return <span className="wood block h-5 w-52 rounded-[3px]" aria-hidden />;
}

export function HomeScreen() {
  const { go } = useNav();
  const profiles = useAppData((d) => d.profiles);

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pt-10 pb-8 sm:pt-16">
      <Logo />
      <p className="mt-6 text-center font-display text-2xl text-parchment-200 sm:text-3xl">
        {profiles.length
          ? 'Who’s playing today?'
          : 'Make a book for the first player'}
      </p>

      <section
        aria-label="Players"
        className="mt-12 flex flex-wrap items-start justify-center gap-y-10"
      >
        {profiles.map((p, i) => {
          const title = titleFor(p.points);
          return (
            <ShelfSlot key={p.id} delay={0.5 + i * 0.08}>
              <motion.button
                type="button"
                onClick={() => go('setup', { profileId: p.id })}
                className="flex flex-col items-center text-center"
                whileHover="lift"
                whileTap="press"
              >
                <motion.span variants={LIFT}>
                  <BookCover
                    name={p.name}
                    avatar={p.avatar}
                    color={p.color}
                    size="lg"
                  />
                </motion.span>
                <Plank />
                <span className="mt-3 font-display text-2xl font-semibold text-parchment-50">
                  {p.name}
                </span>
                <span className="text-sm text-parchment-300">
                  {title.icon} {title.name}
                </span>
                <span className="mt-1 rounded-full bg-black/25 px-3 py-0.5 text-sm font-bold text-gilt-300 tabular-nums">
                  {p.points.toLocaleString()} points
                </span>
              </motion.button>
            </ShelfSlot>
          );
        })}

        {profiles.length < MAX_PLAYERS && (
          <ShelfSlot delay={0.5 + profiles.length * 0.08}>
            <motion.button
              type="button"
              onClick={() => go('editor', { editingId: null })}
              className="flex flex-col items-center text-center"
              whileHover="lift"
              whileTap="press"
            >
              <motion.span
                variants={LIFT}
                className="grid h-52 w-40 place-items-center rounded-lg border-2 border-dashed border-parchment-300/40 text-parchment-200 transition-colors hover:border-gilt-300 hover:text-gilt-200"
              >
                <Plus className="size-12" aria-hidden />
              </motion.span>
              <Plank />
              <span className="mt-3 font-display text-xl font-semibold text-parchment-100">
                New player
              </span>
            </motion.button>
          </ShelfSlot>
        )}

        <ShelfSlot delay={0.9} className="hidden sm:flex" decorative>
          <div className="flex h-52 w-28 items-end">
            <InkyArt mood="idle" />
          </div>
          <Plank />
        </ShelfSlot>
      </section>

      <div className="mt-auto flex justify-end pt-16">
        <button
          type="button"
          onClick={() => go('parent')}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-parchment-300 hover:bg-white/5 hover:text-parchment-100"
        >
          <Settings2 className="size-4" aria-hidden /> Grown-ups
        </button>
      </div>
    </main>
  );
}
