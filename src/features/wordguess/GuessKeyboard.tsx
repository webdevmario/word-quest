import clsx from 'clsx';
import { Delete } from 'lucide-react';

import { STATE_COLORS } from '@/features/wordguess/GuessGrid';
import type { LetterState } from '@/game/wordguess/guess';

import type { ReactNode } from 'react';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

/** On-screen keyboard; keys take on the colors the player has learned. */
export function GuessKeyboard({
  states,
  onKey,
  disabled,
}: {
  states: Record<string, LetterState>;
  onKey: (key: string) => void;
  disabled: boolean;
}) {
  const key = (k: string, label: ReactNode = k, wide = false) => {
    const state = states[k];
    return (
      <button
        key={k}
        type="button"
        disabled={disabled}
        onClick={() => onKey(k)}
        aria-label={
          k === 'ENTER'
            ? 'Enter guess'
            : k === 'BACK'
              ? 'Delete letter'
              : `${k}${state ? `, ${state}` : ''}`
        }
        className={clsx(
          'grid h-13 place-items-center rounded-lg font-display text-lg font-bold shadow-[0_2px_0_rgba(0,0,0,0.35)] transition active:translate-y-0.5 disabled:opacity-60 sm:h-14',
          wide ? 'min-w-0 flex-[1.6] text-sm' : 'min-w-0 flex-1',
          state === 'absent'
            ? 'bg-black/35 text-parchment-300/60'
            : state
              ? 'text-white'
              : 'bg-parchment-200 text-ink hover:bg-parchment-100'
        )}
        style={
          state && state !== 'absent'
            ? { background: STATE_COLORS[state] }
            : undefined
        }
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className="flex w-full max-w-xl flex-col gap-1.5"
      aria-label="Keyboard"
    >
      {ROWS.map((row, i) => (
        <div key={row} className={clsx('flex gap-1.5', i === 1 && 'px-[5%]')}>
          {i === 2 && key('ENTER', 'Enter', true)}
          {[...row].map((k) => key(k))}
          {i === 2 &&
            key('BACK', <Delete className="size-5" aria-hidden />, true)}
        </div>
      ))}
    </div>
  );
}
