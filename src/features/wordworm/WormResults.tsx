import { motion } from 'motion/react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { rain } from '@/fx/confetti';
import { sound } from '@/fx/sound';
import type { Badge } from '@/game/progression';

export interface WormResultsData {
  reason: 'fire' | 'finished';
  score: number;
  words: string[];
  bestWord: { word: string; points: number } | null;
  chapter: number;
  badges: Badge[];
}

export function WormResults({
  data,
  onPlayAgain,
  onChangeGame,
}: {
  data: WormResultsData | null;
  onPlayAgain: () => void;
  onChangeGame: () => void;
}) {
  useEffect(() => {
    if (data) {
      rain();
      sound.fanfare();
    }
  }, [data]);

  const longest =
    data?.words.reduce((a, w) => (w.length > a.length ? w : a), '') ?? '';

  return (
    <Modal
      open={!!data}
      title={
        data?.reason === 'fire'
          ? 'The fire reached the shelf!'
          : 'Great reading!'
      }
      className="text-center"
    >
      {data && (
        <>
          <p className="mt-1 text-ink-soft">
            {data.reason === 'fire'
              ? 'Use burning tiles in words to put them out before they reach the bottom.'
              : 'Here’s how your game went.'}
          </p>
          <motion.p
            className="mt-4 font-display text-6xl font-semibold tabular-nums"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          >
            {data.score.toLocaleString()}
          </motion.p>
          <p className="text-ink-soft">points</p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/60 p-2">
              <dt className="text-xs text-ink-soft">Words</dt>
              <dd className="text-xl font-bold">{data.words.length}</dd>
            </div>
            <div className="rounded-2xl bg-white/60 p-2">
              <dt className="text-xs text-ink-soft">Longest</dt>
              <dd className="truncate text-xl font-bold">{longest || '—'}</dd>
            </div>
            <div className="rounded-2xl bg-white/60 p-2">
              <dt className="text-xs text-ink-soft">Chapter</dt>
              <dd className="text-xl font-bold">{data.chapter}</dd>
            </div>
          </dl>
          {data.bestWord && (
            <p className="mt-3">
              Best word: <b>{data.bestWord.word}</b> for {data.bestWord.points}{' '}
              points
            </p>
          )}
          {data.badges.length > 0 && (
            <p className="mt-3 rounded-2xl bg-parchment-300/40 px-3 py-2">
              {data.badges.map((b) => (
                <span key={b.id} className="mx-2 inline-block font-semibold">
                  {b.icon} {b.name}
                </span>
              ))}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <Button className="flex-1" onClick={onChangeGame}>
              Change game
            </Button>
            <Button variant="gilt" className="flex-1" onClick={onPlayAgain}>
              Play again
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
