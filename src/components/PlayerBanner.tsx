import { Pencil } from 'lucide-react';
import { motion } from 'motion/react';

import { BookCover } from '@/components/BookCover';
import { nextTitle, titleFor, titleProgress } from '@/game/progression';
import type { Profile } from '@/game/types';

/** Player's book, title and progress toward the next title. */
export function PlayerBanner({
  profile,
  onEdit,
}: {
  profile: Profile;
  onEdit?: () => void;
}) {
  const title = titleFor(profile.points);
  const next = nextTitle(profile.points);
  const progress = titleProgress(profile.points);

  return (
    <section className="wood flex items-center gap-4 rounded-[26px] p-4 sm:gap-6 sm:p-5">
      <BookCover
        name={profile.name}
        avatar={profile.avatar}
        color={profile.color}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate font-display text-3xl font-semibold text-parchment-50">
            {profile.name}
          </h1>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg p-1.5 text-parchment-300 hover:bg-white/10 hover:text-parchment-50"
              aria-label="Edit player"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          )}
        </div>
        <p className="font-semibold text-gilt-300">
          {title.icon} {title.name}
        </p>
        <div
          className="mt-2 h-3 overflow-hidden rounded-full bg-black/40 shadow-inner"
          role="progressbar"
          aria-label="Progress to next title"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gilt-500 via-gilt-300 to-gilt-200"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(3, progress * 100)}%` }}
            transition={{ duration: 1, ease: [0.2, 0.9, 0.3, 1] }}
          />
        </div>
        <p className="mt-1.5 text-sm text-parchment-300">
          {next ? (
            <>
              {(next.min - profile.points).toLocaleString()} points to{' '}
              <span className="whitespace-nowrap">
                {next.icon} {next.name}
              </span>
            </>
          ) : (
            'You reached the top title!'
          )}
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <div className="font-display text-4xl font-semibold text-parchment-50 tabular-nums">
          {profile.points.toLocaleString()}
        </div>
        <div className="text-sm text-parchment-300">points</div>
      </div>
    </section>
  );
}
