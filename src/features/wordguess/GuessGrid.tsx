import clsx from 'clsx';
import { motion } from 'motion/react';

import type { LetterState } from '@/game/wordguess/guess';

export const STATE_COLORS: Record<LetterState, string> = {
  correct: '#2eb872',
  present: '#e8a12a',
  absent: '#5e4a3a',
};

interface Row {
  word: string;
  states: LetterState[] | null;
}

/** One tile that flips over to show its color, like a card turning. */
function GuessTile({
  letter,
  state,
  flip,
  delay,
  size,
}: {
  letter: string;
  state: LetterState | null;
  flip: boolean;
  delay: number;
  size: number;
}) {
  const face = { width: size, height: size, fontSize: size * 0.55 };
  return (
    <div style={{ ...face, perspective: 500 }} className="relative">
      <motion.div
        className="relative size-full"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{
          rotateX: state ? 180 : 0,
          scale: letter && !state ? [1, 1.12, 1] : 1,
        }}
        transition={
          state
            ? flip
              ? { rotateX: { delay, duration: 0.55, ease: 'easeInOut' } }
              : { duration: 0 }
            : { duration: 0.12 }
        }
      >
        <span
          className={clsx('tile absolute inset-0', !letter && 'opacity-35')}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {letter}
        </span>
        <span
          className="tile absolute inset-0"
          data-found=""
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
            ['--found' as string]: state ? STATE_COLORS[state] : undefined,
          }}
          aria-hidden={!state}
        >
          {letter}
        </span>
      </motion.div>
    </div>
  );
}

export function GuessGrid({
  rows,
  length,
  maxGuesses,
  revealRow,
  shakeRow,
  bounceRow,
  size,
}: {
  rows: Row[];
  length: number;
  maxGuesses: number;
  /** The row that should flip now (older rows show their colors right away). */
  revealRow: number | null;
  shakeRow: number | null;
  bounceRow: number | null;
  size: number;
}) {
  return (
    <div
      className="flex flex-col gap-1.5"
      role="grid"
      aria-label="Your guesses"
    >
      {Array.from({ length: maxGuesses }, (_, r) => {
        const row = rows[r];
        const word = row?.word ?? '';
        return (
          <motion.div
            key={r}
            role="row"
            className="flex justify-center gap-1.5"
            animate={shakeRow === r ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            aria-label={
              row?.states
                ? `${word}: ${row.states.map((s, i) => `${word[i]} ${s === 'correct' ? 'right spot' : s === 'present' ? 'wrong spot' : 'not in word'}`).join(', ')}`
                : word || 'empty row'
            }
          >
            {Array.from({ length }, (_, i) => (
              <motion.div
                key={i}
                role="gridcell"
                animate={bounceRow === r ? { y: [0, -18, 0] } : { y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.45 }}
              >
                <GuessTile
                  letter={word[i] ?? ''}
                  state={row?.states?.[i] ?? null}
                  flip={revealRow === r}
                  delay={i * 0.28}
                  size={size}
                />
              </motion.div>
            ))}
          </motion.div>
        );
      })}
    </div>
  );
}
