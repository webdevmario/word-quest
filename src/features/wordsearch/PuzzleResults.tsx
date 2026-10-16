import { motion } from 'motion/react';
import { useEffect } from 'react';

import { formatTime } from '@/components/GameHud';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { rain } from '@/fx/confetti';
import { sound } from '@/fx/sound';
import type { Badge, Title } from '@/game/progression';
import type { Profile } from '@/game/types';
import type { PuzzleBonuses } from '@/store/actions';

export interface ResultsData {
  seconds: number;
  wordPoints: number;
  wordCount: number;
  bonuses: PuzzleBonuses;
  badges: Badge[];
  newTitle: Title | null;
}

export function PuzzleResults({
  data,
  profile,
  onPlayAgain,
  onChangeGame,
}: {
  data: ResultsData | null;
  profile: Profile;
  onPlayAgain: () => void;
  onChangeGame: () => void;
}) {
  useEffect(() => {
    if (data) {
      rain();
      sound.fanfare();
    }
  }, [data]);

  const rows: [string, number][] = data
    ? [
        ['Words found', data.wordPoints],
        ['Puzzle cleared', data.bonuses.clear],
        ['Speed bonus', data.bonuses.speed],
        ['No-hint bonus', data.bonuses.noHint],
      ]
    : [];

  return (
    <Modal open={!!data} title="Puzzle complete!" className="text-center">
      {data && (
        <>
          <motion.div
            className="mx-auto -mt-16 mb-2 grid size-24 place-items-center rounded-full bg-gradient-to-b from-gilt-200 via-gilt-400 to-gilt-500 text-5xl shadow-xl ring-4 ring-parchment-50"
            style={{ perspective: 600 }}
            initial={{ rotateY: 0, scale: 0 }}
            animate={{ rotateY: 720, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.2, 0.7, 0.3, 1.1] }}
            aria-hidden
          >
            🏆
          </motion.div>
          <p className="mt-1 text-ink-soft">
            {profile.name} found all {data.wordCount} words in{' '}
            <b className="text-ink">{formatTime(data.seconds)}</b>
            {data.bonuses.record && (
              <span className="font-bold text-ruby"> — a new record!</span>
            )}
          </p>
          <dl className="mt-4 text-left">
            {rows.map(([label, value], i) => (
              <motion.div
                key={label}
                className="flex justify-between border-b border-dashed border-parchment-400/60 py-2"
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.12 }}
              >
                <dt>{label}</dt>
                <dd className="font-bold tabular-nums">
                  +{value.toLocaleString()}
                </dd>
              </motion.div>
            ))}
            <div className="flex justify-between pt-3 font-display text-2xl font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">
                {(data.wordPoints + data.bonuses.total).toLocaleString()}
              </dd>
            </div>
          </dl>
          {data.newTitle && (
            <p className="mt-3 rounded-2xl bg-gilt-200/70 px-3 py-2 font-semibold">
              {data.newTitle.icon} New title: {data.newTitle.name}
            </p>
          )}
          {data.badges.length > 0 && (
            <div className="mt-3 rounded-2xl bg-parchment-300/40 px-3 py-2">
              <p className="font-bold">New badges</p>
              <p>
                {data.badges.map((b) => (
                  <span key={b.id} className="mx-2 inline-block">
                    {b.icon} {b.name}
                  </span>
                ))}
              </p>
            </div>
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
