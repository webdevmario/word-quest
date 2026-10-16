import clsx from 'clsx';
import { Check, Lightbulb } from 'lucide-react';
import { stagger, useAnimate } from 'motion/react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useNav } from '@/app/nav';
import { useCurrentProfile } from '@/app/useCurrentProfile';
import { GameHud, Timer } from '@/components/GameHud';
import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { speak } from '@/dictionary/speech';
import { WordToast } from '@/features/learn/WordToast';
import type { ToastWord } from '@/features/learn/WordToast';
import { PuzzleResults } from '@/features/wordsearch/PuzzleResults';
import type { ResultsData } from '@/features/wordsearch/PuzzleResults';
import { celebrate, mascotSay, queueBadges, titleReveal } from '@/fx/fxBus';
import { buzz } from '@/fx/haptics';
import { sound } from '@/fx/sound';
import { FOUND_COLORS, GOLDEN_COLOR } from '@/game/appearance';
import { themeInfo, themeWords } from '@/game/catalog';
import { DIFFICULTIES } from '@/game/difficulty';
import { celebrationTier, comboBonus, SCORING } from '@/game/scoring';
import {
  generatePuzzle,
  isBackwards,
  isDiagonal,
} from '@/game/wordsearch/generator';
import type { Cell, PlacedWord, Puzzle } from '@/game/wordsearch/generator';
import {
  isAligned,
  lineCells,
  matchWord,
  sameCell,
  snapEnd,
} from '@/game/wordsearch/selection';
import { completePuzzle, recordSearchWord } from '@/store/actions';
import type { Rewards } from '@/store/actions';
import { getData, useAppData } from '@/store/appStore';

import type { PointerEvent as ReactPointerEvent } from 'react';

const key = ([r, c]: Cell) => `${r}-${c}`;

interface Found {
  color: string;
  points: number;
}

function newGame(puzzle: Puzzle) {
  return {
    puzzle,
    found: new Map<string, Found>(),
    cellColor: new Map<string, string>(),
    hinted: new Set<string>(),
    score: 0,
    combo: 0,
    lastFindAt: 0,
    startedAt: Date.now(),
    finishedAt: null as number | null,
  };
}

function announce(rewards: Rewards) {
  queueBadges(rewards.badges);
  if (rewards.newTitle) {
    titleReveal(rewards.newTitle);
  }
}

export function WordSearchGame() {
  const { go, openCard } = useNav();
  const profile = useCurrentProfile();
  const custom = useAppData((d) => d.custom.lists);
  const speakWords = useAppData((d) => d.settings.speakWords);

  const makePuzzle = useCallback(() => {
    const prefs = getData().profiles.find((p) => p.id === profile?.id)?.prefs;
    const theme = prefs?.theme ?? 'animals';
    return generatePuzzle(
      themeWords(theme, custom),
      prefs?.difficulty ?? 'easy',
      theme
    );
  }, [profile?.id, custom]);

  const [game, setGame] = useState(() => newGame(makePuzzle()));
  const [selection, setSelection] = useState<{ start: Cell; end: Cell } | null>(
    null
  );
  const [tapStart, setTapStart] = useState<Cell | null>(null);
  const [hintCell, setHintCell] = useState<string | null>(null);
  const [shake, setShake] = useState<Cell[]>([]);
  const [toast, setToast] = useState<ToastWord | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const lastTicks = useRef(0);

  const { puzzle } = game;
  const level = DIFFICULTIES[puzzle.difficulty];
  const theme = themeInfo(puzzle.themeId, custom);

  const selected = useMemo(() => {
    const set = new Set<string>();
    if (selection) {
      lineCells(selection.start, selection.end).forEach((c) => set.add(key(c)));
    }
    if (tapStart) {
      set.add(key(tapStart));
    }
    return set;
  }, [selection, tapStart]);

  const finished = game.finishedAt !== null;

  if (!profile) {
    return null;
  }

  const cellAt = (e: ReactPointerEvent, clamp: boolean): Cell | null => {
    const rect = scope.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }
    const n = puzzle.size;
    let c = Math.floor(((e.clientX - rect.left) / rect.width) * n);
    let r = Math.floor(((e.clientY - rect.top) / rect.height) * n);
    if (!clamp && (r < 0 || r >= n || c < 0 || c >= n)) {
      return null;
    }
    r = Math.max(0, Math.min(n - 1, r));
    c = Math.max(0, Math.min(n - 1, c));
    return [r, c];
  };

  const tickTo = (length: number) => {
    if (length > lastTicks.current) {
      sound.tick(length - 1);
      buzz('tap');
    }
    lastTicks.current = length;
  };

  const flipTiles = (cells: Cell[]) => {
    const els = cells
      .map((c) => scope.current?.querySelector(`[data-cell="${key(c)}"]`))
      .filter((el): el is Element => !!el);
    void animate(
      els,
      { rotateY: [0, 360], scale: [1, 1.35, 1] },
      { duration: 0.75, delay: stagger(0.05), ease: [0.2, 0.8, 0.3, 1.1] }
    );
  };

  const onFound = (word: PlacedWord, cells: Cell[]) => {
    const now = Date.now();
    const combo =
      now - game.lastFindAt < SCORING.comboWindowMs ? game.combo + 1 : 1;
    const hinted = game.hinted.has(word.text);
    const base = hinted ? Math.ceil(word.value / 2) : word.value;
    const points = base + comboBonus(combo, puzzle.mult);
    const color = word.golden
      ? GOLDEN_COLOR
      : (FOUND_COLORS[game.found.size % FOUND_COLORS.length] as string);

    const found = new Map(game.found).set(word.text, { color, points });
    const cellColor = new Map(game.cellColor);
    cells.forEach((c) => cellColor.set(key(c), color));
    const allFound = found.size === puzzle.words.length;
    setGame({
      ...game,
      found,
      cellColor,
      score: game.score + points,
      combo,
      lastFindAt: now,
      finishedAt: allFound ? now : null,
    });

    const rewards = recordSearchWord(profile.id, {
      word: word.text,
      points,
      golden: word.golden,
      backwards: isBackwards(word.dir),
      diagonal: isDiagonal(word.dir),
      combo,
    });

    // The big moment.
    flipTiles(cells);
    const tiles = cells
      .map((c) =>
        scope.current
          ?.querySelector(`[data-cell="${key(c)}"]`)
          ?.getBoundingClientRect()
      )
      .filter((r): r is DOMRect => !!r);
    const chips = [
      word.golden ? 'Golden word ×2' : null,
      combo >= 2 ? `Combo ×${combo}` : null,
      hinted ? 'Hint used' : null,
    ].filter((c): c is string => !!c);
    celebrate({
      word: word.text,
      points,
      tier: celebrationTier(word.text.length, points),
      color,
      tiles,
      board: (scope.current as HTMLDivElement).getBoundingClientRect(),
      chips,
    });
    if (word.golden) {
      sound.shimmer();
    }
    if (speakWords) {
      setTimeout(() => speak(word.text.toLowerCase()), 500);
    }
    setToast({ id: now, word: word.text, isNew: rewards.newWord });
    announce(rewards);
    scope.current?.classList.remove('board-bump');
    void scope.current?.offsetWidth;
    scope.current?.classList.add('board-bump');

    if (allFound) {
      const seconds = Math.floor((now - game.startedAt) / 1000);
      setTimeout(
        () => {
          const done = completePuzzle(profile.id, {
            difficulty: puzzle.difficulty,
            themeId: puzzle.themeId,
            seconds,
            wordCount: puzzle.words.length,
            hintsUsed: game.hinted.size,
            wordPoints: game.score + points,
          });
          setGame((g) => ({ ...g, score: g.score + done.bonuses.total }));
          setResults({
            seconds,
            wordPoints: game.score + points,
            bonuses: done.bonuses,
            badges: done.badges,
            newTitle: done.newTitle,
            wordCount: puzzle.words.length,
          });
          queueBadges(done.badges, 1200);
        },
        rewards.newTitle ? 5200 : 2000
      );
    }
  };

  const tryCells = (a: Cell, b: Cell) => {
    const cells = lineCells(a, b);
    const word = matchWord(
      puzzle.grid,
      cells,
      puzzle.words,
      new Set(game.found.keys())
    );
    if (word) {
      onFound(word, cells);
    } else if (cells.length > 1) {
      setShake(cells);
      setTimeout(() => setShake([]), 400);
      sound.miss();
      buzz('miss');
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (finished) {
      return;
    }
    const cell = cellAt(e, false);
    if (!cell) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    lastTicks.current = tapStart ? 1 : 0;
    tickTo(tapStart ? 2 : 1);
    setSelection({ start: cell, end: cell });
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!selection) {
      return;
    }
    const raw = cellAt(e, true);
    if (!raw) {
      return;
    }
    const end = snapEnd(selection.start, raw, puzzle.size);
    if (!sameCell(end, selection.end)) {
      setSelection({ ...selection, end });
      tickTo(lineCells(selection.start, end).length);
    }
  };

  const onPointerUp = () => {
    if (!selection) {
      return;
    }
    const { start, end } = selection;
    setSelection(null);
    if (!sameCell(start, end)) {
      setTapStart(null);
      tryCells(start, end);
    } else if (
      tapStart &&
      !sameCell(tapStart, start) &&
      isAligned(tapStart, start)
    ) {
      // Tap-tap mode for little fingers: first letter, then last letter.
      setTapStart(null);
      tryCells(tapStart, start);
    } else {
      setTapStart(sameCell(tapStart, start) ? null : start);
    }
  };

  const giveHint = () => {
    if (finished) {
      return;
    }
    const left = puzzle.words.filter((w) => !game.found.has(w.text));
    const fresh = left.filter((w) => !game.hinted.has(w.text));
    const pool = fresh.length ? fresh : left;
    const word = pool[Math.floor(Math.random() * pool.length)];
    if (!word) {
      return;
    }
    if (!game.hinted.has(word.text)) {
      setGame({ ...game, hinted: new Set(game.hinted).add(word.text) });
    }
    setHintCell(key(word.cells[0] as Cell));
    setTimeout(() => setHintCell(null), 2800);
    sound.tap();
    mascotSay(
      'think',
      `Look for the ${word.text[0]} that starts ${word.text}!`,
      3000
    );
  };

  const playAgain = () => {
    setResults(null);
    setToast(null);
    setGame(newGame(makePuzzle()));
  };

  const fontSize = `calc(var(--board) / ${puzzle.size} * 0.52)`;

  return (
    <main className="mx-auto max-w-6xl px-3 pt-3 pb-24 sm:px-4">
      <GameHud
        score={game.score}
        onQuit={() =>
          game.found.size && !finished ? setConfirmQuit(true) : go('setup')
        }
        stats={
          <>
            <span className="text-parchment-200">
              ⏱ <Timer startedAt={game.startedAt} stoppedAt={game.finishedAt} />
            </span>
            <span className="hidden text-parchment-200 sm:inline">
              {game.found.size}/{puzzle.words.length} found
            </span>
          </>
        }
        actions={
          <Button
            variant="wood"
            size="sm"
            onClick={giveHint}
            disabled={finished}
          >
            <Lightbulb className="size-5" aria-hidden />
            <span className="hidden sm:inline">Hint</span>
          </Button>
        }
      />

      <div className="mt-4 flex flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center">
        <div className="tray shrink-0">
          <div
            ref={scope}
            role="grid"
            aria-label={`Word search, ${puzzle.size} by ${puzzle.size}`}
            className="grid touch-none gap-[3px] select-none [--board:min(calc(100vw-48px),calc(100dvh-230px-var(--safe-top)-var(--safe-bottom)),600px)] lg:[--board:min(calc(100dvh-140px-var(--safe-top)-var(--safe-bottom)),620px)]"
            style={{
              width: 'var(--board)',
              height: 'var(--board)',
              gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`,
              perspective: 700,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setSelection(null)}
          >
            {puzzle.grid.flatMap((row, r) =>
              row.map((ch, c) => {
                const k = key([r, c]);
                const color = game.cellColor.get(k);
                return (
                  <div
                    key={k}
                    role="gridcell"
                    data-cell={k}
                    className={clsx(
                      'tile',
                      shake.some((s) => key(s) === k) && 'shake'
                    )}
                    data-selected={selected.has(k) ? 'true' : undefined}
                    data-found={color && !selected.has(k) ? '' : undefined}
                    data-hint={hintCell === k ? 'true' : undefined}
                    style={{ fontSize, ['--found' as string]: color }}
                  >
                    {ch}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <aside className="w-full max-w-[620px] lg:w-72">
          <div className="hidden h-32 lg:block">
            <Mascot className="mx-auto h-full w-28" />
          </div>
          <div className="wood rounded-[24px] p-4">
            <h2 className="flex items-center justify-between font-display text-xl font-semibold text-parchment-50">
              <span>
                {theme.icon} {theme.name}
              </span>
              <span className="rounded-full bg-black/30 px-2.5 py-0.5 font-sans text-sm text-parchment-200">
                {level.icon} {level.name}
              </span>
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
              {puzzle.words.map((w) => {
                const found = game.found.get(w.text);
                return (
                  <li key={w.text}>
                    <button
                      type="button"
                      onClick={() => openCard(w.text)}
                      className={clsx(
                        'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-left font-bold tracking-wide transition',
                        found
                          ? 'bg-black/25'
                          : 'bg-parchment-100 text-ink hover:bg-parchment-50'
                      )}
                      aria-label={`${w.text}${found ? ', found' : ''}. Open word card`}
                    >
                      <span className="flex items-center gap-2">
                        {found && (
                          <span
                            className="size-2.5 rounded-full"
                            style={{ background: found.color }}
                            aria-hidden
                          />
                        )}
                        <span
                          className={clsx(
                            found &&
                              'text-parchment-300 line-through decoration-2'
                          )}
                        >
                          {w.text}
                        </span>
                      </span>
                      {found && (
                        <Check className="size-4 text-emerald" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-parchment-300">
              Tap a word to hear it and learn what it means.
            </p>
          </div>
        </aside>
      </div>

      <WordToast item={toast} onDone={() => setToast(null)} />

      <PuzzleResults
        data={results}
        profile={profile}
        onPlayAgain={playAgain}
        onChangeGame={() => go('setup')}
      />

      <Modal
        open={confirmQuit}
        onClose={() => setConfirmQuit(false)}
        title="Leave this puzzle?"
      >
        <p className="mt-2 text-ink-soft">
          You keep the points you already earned.
        </p>
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" onClick={() => setConfirmQuit(false)}>
            Keep playing
          </Button>
          <Button variant="gilt" className="flex-1" onClick={() => go('setup')}>
            Leave puzzle
          </Button>
        </div>
      </Modal>
    </main>
  );
}
