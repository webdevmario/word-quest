import { Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { RollingNumber } from '@/components/ui/RollingNumber';
import { updateSettings } from '@/store/actions';
import { useAppData } from '@/store/appStore';

import type { ReactNode } from 'react';

export const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Ticks once a second until the game stops. */
export function Timer({
  startedAt,
  stoppedAt,
}: {
  startedAt: number;
  stoppedAt: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (stoppedAt) {
      return;
    }
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [stoppedAt]);
  const seconds = Math.max(
    0,
    Math.floor(((stoppedAt ?? now) - startedAt) / 1000)
  );
  return <span className="tabular-nums">{formatTime(seconds)}</span>;
}

export function MuteButton() {
  const muted = useAppData((d) => d.settings.muted);
  return (
    <Button
      variant="wood"
      size="sm"
      onClick={() => updateSettings({ muted: !muted })}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      aria-pressed={!muted}
    >
      {muted ? (
        <VolumeX className="size-5" aria-hidden />
      ) : (
        <Volume2 className="size-5" aria-hidden />
      )}
    </Button>
  );
}

/** Top bar for both games: quit, score (the fly-up target), extra stats, actions. */
export function GameHud({
  score,
  onQuit,
  stats,
  actions,
}: {
  score: number;
  onQuit: () => void;
  stats?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-2">
      <Button variant="wood" size="sm" onClick={onQuit} aria-label="Leave game">
        <X className="size-5" aria-hidden />
      </Button>
      <div className="wood flex h-12 flex-1 items-center justify-center gap-4 rounded-2xl px-4 sm:gap-8">
        <div className="flex items-baseline gap-2" data-score-target>
          <span className="text-sm text-parchment-300">Score</span>
          <span className="font-display text-2xl font-semibold text-gilt-200">
            <RollingNumber value={score} />
          </span>
        </div>
        {stats}
      </div>
      {actions}
      <MuteButton />
    </header>
  );
}
