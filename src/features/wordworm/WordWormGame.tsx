import clsx from 'clsx';
import { Check, Flag, Lightbulb, Shuffle, Undo2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useNav } from '@/app/nav';
import { useCurrentProfile } from '@/app/useCurrentProfile';
import { GameHud } from '@/components/GameHud';
import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { speak } from '@/dictionary/speech';
import { useDictionary } from '@/dictionary/useDictionary';
import { WordToast } from '@/features/learn/WordToast';
import type { ToastWord } from '@/features/learn/WordToast';
import { HexBoard } from '@/features/wordworm/HexBoard';
import { WormResults } from '@/features/wordworm/WormResults';
import type { WormResultsData } from '@/features/wordworm/WormResults';
import { rain } from '@/fx/confetti';
import { celebrate, mascotSay, queueBadges, titleReveal } from '@/fx/fxBus';
import { buzz } from '@/fx/haptics';
import { sound } from '@/fx/sound';
import { GEM_COLORS } from '@/game/appearance';
import { DIFFICULTIES } from '@/game/difficulty';
import type { Badge } from '@/game/progression';
import { pick } from '@/game/random';
import { celebrationTier, SCORING } from '@/game/scoring';
import {
  createBoard,
  GEM_MULTIPLIER,
  isAdjacent,
  pathWord,
  plantWord,
  samePos,
  scorePath,
  shuffleBoard,
  submitPath,
  tileAt,
  toggleInPath,
} from '@/game/wordworm/board';
import type { Board, Pos } from '@/game/wordworm/board';
import { pickBonusWord } from '@/game/wordworm/bonus';
import type { BonusWord } from '@/game/wordworm/bonus';
import { findWords, pickHint } from '@/game/wordworm/solver';
import { addPoints, finishWormGame, recordWormWord } from '@/store/actions';
import type { Rewards } from '@/store/actions';
import { useAppData } from '@/store/appStore';

const SHUFFLES = 3;
const HINTS = 3;
const chapterGoal = (chapter: number, mult: number) =>
  Math.round(300 * chapter * mult);

function freshBoard(bonus: BonusWord): Board {
  const board = createBoard();
  return plantWord(board, bonus.word) ?? board;
}

function announce(rewards: Rewards) {
  queueBadges(rewards.badges);
  if (rewards.newTitle) {
    titleReveal(rewards.newTitle);
  }
}

export function WordWormGame() {
  const { go } = useNav();
  const profile = useCurrentProfile();
  const speakWords = useAppData((d) => d.settings.speakWords);
  const { dict, error, retry } = useDictionary();

  const difficulty = profile?.prefs.difficulty ?? 'easy';
  const level = DIFFICULTIES[difficulty];
  const minLength = level.worm.minWordLength;

  const [bonus, setBonus] = useState<BonusWord>(() => pickBonusWord(minLength));
  const [board, setBoard] = useState<Board>(() => freshBoard(bonus));
  const [path, setPath] = useState<Pos[]>([]);
  const [score, setScore] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [best, setBest] = useState<{ word: string; points: number } | null>(
    null
  );
  const [chapter, setChapter] = useState(1);
  const [chapterStart, setChapterStart] = useState(0);
  const [shuffles, setShuffles] = useState(SHUFFLES);
  const [hints, setHints] = useState(HINTS);
  const [hintIds, setHintIds] = useState<Set<number>>(new Set());
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState<ToastWord | null>(null);
  const [chapterBanner, setChapterBanner] = useState<number | null>(null);
  const [results, setResults] = useState<WormResultsData | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showClue, setShowClue] = useState(false);
  const earnedBadges = useRef<Badge[]>([]);
  const dragging = useRef(false);

  const word = pathWord(board, path);
  const valid = !!dict && word.length >= minLength && dict.isWord(word);
  const preview = valid ? scorePath(board, path, level.mult) : null;
  const isBonus = valid && word === bonus.word;
  const over = results !== null;
  const goal = chapterGoal(chapter, level.mult);
  const progress = Math.min(1, (score - chapterStart) / goal);

  const select = useCallback(
    (next: Pos[]) => {
      if (next.length > path.length) {
        sound.tick(next.length - 1);
        buzz('tap');
      }
      setPath(next);
    },
    [path.length]
  );

  const endGame = (
    reason: WormResultsData['reason'],
    finalScore: number,
    finalWords = words,
    bestWord = best
  ) => {
    if (!profile) {
      return;
    }
    const rewards = finishWormGame(profile.id, finalScore);
    earnedBadges.current.push(...rewards.badges);
    queueBadges(rewards.badges, 600);
    setResults({
      reason,
      score: finalScore,
      words: finalWords,
      bestWord,
      chapter,
      badges: earnedBadges.current,
    });
  };

  function submit() {
    if (!profile || !valid || !preview || over) {
      return;
    }
    const tiles = path
      .map((p) => {
        const t = tileAt(board, p);
        return document
          .querySelector(`[data-tile-id="${t?.id}"]`)
          ?.getBoundingClientRect();
      })
      .filter((r): r is DOMRect => !!r);
    const boardRect = document
      .querySelector('[aria-label="Word Worm letter tiles"]')
      ?.getBoundingClientRect();

    const used = path.map((p) => tileAt(board, p)).filter((t) => !!t);
    const gems = used.filter((t) => t.gem);
    const fires = used.filter((t) => t.fire).length;
    const points = isBonus
      ? preview.total * SCORING.bonusWordMultiplier
      : preview.total;

    const result = submitPath(
      board,
      path,
      {
        fireChance: level.worm.fireChance,
        fireWordMax: level.worm.fireWordMax,
      },
      Math.random
    );

    let nextBoard = result.board;
    let nextBonus = bonus;
    if (isBonus) {
      nextBonus = pickBonusWord(minLength, [bonus.word]);
      nextBoard = plantWord(nextBoard, nextBonus.word) ?? nextBoard;
      setBonus(nextBonus);
      setShowClue(false);
    }

    const newScore = score + points;
    setBoard(nextBoard);
    setPath([]);
    setHintIds(new Set());
    setScore(newScore);
    const nextWords = [word, ...words];
    const nextBest = !best || points > best.points ? { word, points } : best;
    setWords(nextWords);
    setBest(nextBest);

    const rewards = recordWormWord(profile.id, {
      word,
      points,
      gemsUsed: gems.length,
      firesPutOut: fires,
      bonusWord: isBonus,
    });
    earnedBadges.current.push(...rewards.badges);

    const chips = [
      isBonus ? `Bonus word ×${SCORING.bonusWordMultiplier}` : null,
      ...gems.map((g) => `${g.gem} gem ×${GEM_MULTIPLIER[g.gem!]}`),
      fires ? `Fire out +${fires * SCORING.fireOutBonus}` : null,
      result.gemSpawned ? `New ${result.gemSpawned} gem!` : null,
    ].filter((c): c is string => !!c);

    celebrate({
      word,
      points,
      tier: celebrationTier(word.length, points),
      color: gems[0]?.gem ? GEM_COLORS[gems[0].gem] : profile.color,
      tiles,
      board: boardRect ?? new DOMRect(innerWidth / 2, innerHeight / 2, 0, 0),
      chips,
    });
    if (result.gemSpawned || isBonus) {
      setTimeout(() => sound.shimmer(), 500);
    }
    if (speakWords) {
      setTimeout(() => speak(word.toLowerCase()), 500);
    }
    setToast({ id: words.length + 1, word, isNew: rewards.newWord });
    announce(rewards);

    if (result.fireSpawned) {
      setTimeout(() => {
        sound.fire();
        mascotSay(
          'oops',
          'Uh oh, a fire tile! Use it in a word to put it out.',
          3200
        );
      }, 1500);
    }

    // A full chapter bar: bonus points and every fire goes out.
    if (newScore - chapterStart >= goal && !result.gameOver) {
      const bonusPoints = Math.round(50 * chapter * level.mult);
      setTimeout(() => {
        setChapter((c) => c + 1);
        setChapterStart(newScore + bonusPoints);
        setScore((s) => s + bonusPoints);
        setBoard((b) => ({
          ...b,
          columns: b.columns.map((col) =>
            col.map((t) => ({ ...t, fire: false }))
          ),
        }));
        setChapterBanner(chapter + 1);
        rain();
        sound.fanfare();
        announce(addPoints(profile.id, bonusPoints));
        setTimeout(() => setChapterBanner(null), 2600);
      }, 1700);
    }

    if (result.gameOver) {
      setTimeout(() => {
        sound.fire();
        endGame('fire', newScore, nextWords, nextBest);
      }, 1800);
    }
  }

  const onTileDown = (pos: Pos) => {
    dragging.current = true;
    const last = path[path.length - 1];
    // Tapping the last tile again sends the word, like in Bookworm.
    if (last && samePos(last, pos) && valid) {
      submit();
      return;
    }
    select(toggleInPath(board, path, pos));
  };

  const onDragOver = (pos: Pos) => {
    if (!dragging.current) {
      return;
    }
    const last = path[path.length - 1];
    if (!last || samePos(last, pos)) {
      return;
    }
    const before = path[path.length - 2];
    if (before && samePos(before, pos)) {
      setPath(path.slice(0, -1));
    } else if (
      isAdjacent(board, last, pos) &&
      !path.some((p) => samePos(p, pos))
    ) {
      select([...path, pos]);
    }
  };

  const onShuffle = () => {
    if (!shuffles || over) {
      return;
    }
    let next = shuffleBoard(board);
    next = plantWord(next, bonus.word) ?? next;
    // On harder levels a shuffle costs a fire tile, like in Bookworm.
    if (level.worm.fireChance > 0) {
      const top = next.columns
        .map((col) => col[0])
        .filter((t) => t && !t.gem && !t.fire);
      const tile = top.length ? pick(Math.random, top) : null;
      if (tile) {
        tile.fire = true;
      }
    }
    setBoard(next);
    setPath([]);
    setShuffles((s) => s - 1);
    sound.whoosh();
    mascotSay('think', 'Fresh letters!', 1500);
  };

  const onHint = () => {
    if (!dict || !hints || over) {
      return;
    }
    const found = findWords(board, dict, minLength);
    const hint = pickHint(found, (w) => dict.isCommon(w));
    if (!hint) {
      mascotSay('think', 'Hmm, I can’t spot one. Try a shuffle!', 3000);
      return;
    }
    setHints((h) => h - 1);
    setPath([]);
    setHintIds(new Set(hint.path.map((p) => tileAt(board, p)?.id ?? -1)));
    setTimeout(() => setHintIds(new Set()), 3500);
    mascotSay(
      'think',
      `I spy a ${hint.word.length}-letter word starting with ${hint.word[0]}…`,
      3500
    );
  };

  const onNotAWord = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
    sound.miss();
    buzz('miss');
  };

  const playAgain = () => {
    const b = pickBonusWord(minLength);
    setBonus(b);
    setBoard(freshBoard(b));
    setPath([]);
    setScore(0);
    setWords([]);
    setBest(null);
    setChapter(1);
    setChapterStart(0);
    setShuffles(SHUFFLES);
    setHints(HINTS);
    setResults(null);
    setToast(null);
    setShowClue(false);
    earnedBadges.current = [];
  };

  // Keyboard: Enter submits, Backspace removes a letter, Escape clears.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPath([]);
      } else if (e.key === 'Backspace') {
        setPath((p) => p.slice(0, -1));
      } else if (e.key === 'Enter' && valid) {
        submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!profile) {
    return null;
  }

  if (error) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-4 text-center">
        <div className="paper rounded-[28px] p-6">
          <p className="font-display text-2xl">{error}</p>
          <div className="mt-5 flex gap-3">
            <Button className="flex-1" onClick={() => go('setup')}>
              Back
            </Button>
            <Button variant="gilt" className="flex-1" onClick={retry}>
              Try again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const tokens = path.map((p) => tileAt(board, p)?.letter ?? '');

  return (
    <main className="mx-auto max-w-5xl px-3 pt-3 pb-24 sm:px-4">
      <GameHud
        score={score}
        onQuit={() =>
          words.length && !over ? setConfirmFinish(true) : go('setup')
        }
        stats={
          <div className="hidden min-w-32 flex-col sm:flex">
            <span className="text-xs text-parchment-300">
              Chapter {chapter}
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-black/40">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald to-gilt-300"
                animate={{ width: `${progress * 100}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              />
            </div>
          </div>
        }
        actions={
          <Button
            variant="wood"
            size="sm"
            onClick={() => setConfirmFinish(true)}
            disabled={!words.length || over}
            aria-label="Finish game"
          >
            <Flag className="size-5" aria-hidden />
          </Button>
        }
      />

      <div className="mt-4 flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center lg:gap-8">
        <div className="flex w-full max-w-[480px] flex-col items-center gap-3">
          {/* Bonus word clue: a definition to solve, so every round teaches a word. */}
          <button
            type="button"
            onClick={() => setShowClue((s) => !s)}
            className="wood w-full rounded-2xl px-4 py-2.5 text-left"
            aria-expanded={showClue}
          >
            <span className="flex items-center justify-between text-sm font-bold text-gilt-300">
              <span>
                🎁 Bonus word, {bonus.word.length} letters, ×
                {SCORING.bonusWordMultiplier} points
              </span>
              <span className="text-xs text-parchment-300">
                {showClue ? 'Hide letter' : 'Show first letter'}
              </span>
            </span>
            <span className="mt-0.5 block text-parchment-100">
              {bonus.clue}
              {showClue && (
                <b className="ml-2 text-gilt-200">
                  Starts with {bonus.word[0]}
                </b>
              )}
            </span>
          </button>

          {!dict ? (
            <div className="tray grid aspect-[7/8.5] w-full max-w-[480px] place-items-center text-parchment-200">
              Opening the dictionary…
            </div>
          ) : (
            <HexBoard
              board={board}
              path={path}
              hintIds={hintIds}
              shake={shake}
              disabled={over}
              onPointerDown={onTileDown}
              onDragOver={onDragOver}
              onPointerUp={() => {
                dragging.current = false;
              }}
            />
          )}
        </div>

        <aside className="flex w-full max-w-[480px] flex-col gap-3 lg:w-80">
          <div className="hidden h-36 lg:block">
            <Mascot className="mx-auto h-full w-32" />
          </div>

          {/* The word being built. */}
          <div
            className={clsx(
              'paper flex min-h-20 items-center gap-3 rounded-[22px] px-4 py-3 transition-shadow',
              valid &&
                'shadow-[0_0_0_3px_var(--color-emerald),0_0_30px_rgba(46,184,114,0.45)]'
            )}
            aria-live="polite"
          >
            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
              <AnimatePresence initial={false}>
                {tokens.map((letter, i) => (
                  <motion.span
                    key={`${i}-${letter}`}
                    className="tile size-8 text-lg"
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                  >
                    {letter === 'QU' ? 'Qu' : letter}
                  </motion.span>
                ))}
              </AnimatePresence>
              {!tokens.length && (
                <span className="text-ink-soft">
                  Tap or drag across touching letters
                </span>
              )}
            </div>
            <div className="shrink-0 text-right">
              {valid && preview ? (
                <>
                  <div className="font-display text-2xl font-semibold text-emerald tabular-nums">
                    +
                    {(isBonus
                      ? preview.total * SCORING.bonusWordMultiplier
                      : preview.total
                    ).toLocaleString()}
                  </div>
                  <div className="text-xs font-bold text-ink-soft">
                    {isBonus ? 'Bonus word!' : 'Real word!'}
                  </div>
                </>
              ) : (
                word.length > 0 && (
                  <div className="text-xs font-bold text-ink-soft">
                    {word.length < minLength
                      ? `${minLength}+ letters`
                      : 'Not a word yet'}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="wood"
              size="sm"
              onClick={onShuffle}
              disabled={!shuffles || over}
              className="!h-16 flex-col gap-0.5"
            >
              <Shuffle className="size-5" aria-hidden />
              <span className="text-xs">Shuffle {shuffles}</span>
            </Button>
            <Button
              variant="wood"
              size="sm"
              onClick={onHint}
              disabled={!hints || !dict || over}
              className="!h-16 flex-col gap-0.5"
            >
              <Lightbulb className="size-5" aria-hidden />
              <span className="text-xs">Ask Inky {hints}</span>
            </Button>
            <Button
              variant="wood"
              size="sm"
              onClick={() => setPath([])}
              disabled={!path.length}
              className="!h-16 flex-col gap-0.5"
            >
              <Undo2 className="size-5" aria-hidden />
              <span className="text-xs">Clear</span>
            </Button>
            <Button
              variant="gilt"
              size="sm"
              onClick={() => (valid ? submit() : onNotAWord())}
              disabled={!path.length || over}
              className={clsx(
                '!h-16 flex-col gap-0.5',
                valid && 'ring-4 ring-emerald/70'
              )}
            >
              <Check className="size-5" aria-hidden />
              <span className="text-xs">Submit</span>
            </Button>
          </div>

          {words.length > 0 && (
            <div className="wood rounded-2xl p-3">
              <h2 className="text-sm font-bold text-parchment-300">
                Your words
              </h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {words.slice(0, 16).map((w, i) => (
                  <li key={`${w}-${i}`}>
                    <WordChip word={w} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <AnimatePresence>
        {chapterBanner && (
          <motion.div
            className="pointer-events-none fixed inset-x-0 top-1/3 z-40 text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            <p className="gilt-text font-display text-6xl font-bold drop-shadow-[0_3px_0_rgba(0,0,0,0.5)]">
              Chapter {chapterBanner}
            </p>
            <p className="mt-2 text-lg font-bold text-parchment-50">
              Bonus points, and every fire is out!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <WordToast item={toast} onDone={() => setToast(null)} />

      <WormResults
        data={results}
        onPlayAgain={playAgain}
        onChangeGame={() => go('setup')}
      />

      <Modal
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Finish this game?"
      >
        <p className="mt-2 text-ink-soft">Your points are already saved.</p>
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" onClick={() => setConfirmFinish(false)}>
            Keep playing
          </Button>
          <Button
            variant="gilt"
            className="flex-1"
            onClick={() => {
              setConfirmFinish(false);
              endGame('finished', score);
            }}
          >
            Finish game
          </Button>
        </div>
      </Modal>
    </main>
  );
}

function WordChip({ word }: { word: string }) {
  const { openCard } = useNav();
  return (
    <button
      type="button"
      onClick={() => openCard(word)}
      className="rounded-full bg-parchment-100 px-3 py-1 text-sm font-bold text-ink hover:bg-parchment-50"
    >
      {word.toLowerCase()}
    </button>
  );
}
