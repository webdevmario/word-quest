import clsx from 'clsx';
import { motion } from 'motion/react';

const TILT = [-5, 4, -2, 5, -4, 3, -3, 4, -2];

/** "Word Quest" spelled in parchment tiles that tumble in once on load. */
export function Logo({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const words = ['WORD', 'QUEST'];
  let i = 0;
  return (
    <h1
      aria-label="Word Quest"
      className={clsx(
        'flex flex-wrap justify-center gap-x-5 gap-y-2',
        className
      )}
    >
      {words.map((word) => (
        <span key={word} className="flex gap-1.5" aria-hidden>
          {[...word].map((ch) => {
            const n = i++;
            return (
              <motion.span
                key={n}
                className={clsx(
                  'tile',
                  compact
                    ? 'size-9 text-xl'
                    : 'size-12 text-3xl sm:size-16 sm:text-4xl'
                )}
                data-selected={
                  word === 'QUEST' && ch === 'Q' ? 'true' : undefined
                }
                initial={{ y: -80, rotate: -40, opacity: 0 }}
                animate={{ y: 0, rotate: TILT[n % TILT.length], opacity: 1 }}
                transition={{
                  delay: compact ? 0 : 0.1 + n * 0.06,
                  type: 'spring',
                  stiffness: 260,
                  damping: 14,
                }}
              >
                {ch}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
