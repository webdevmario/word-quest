import { BookOpen, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useNav } from '@/app/nav';
import { useCurrentProfile } from '@/app/useCurrentProfile';
import { GameHud } from '@/components/GameHud';
import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { localMeaning } from '@/dictionary/lookup';
import { speak } from '@/dictionary/speech';
import { useDictionary } from '@/dictionary/useDictionary';
import { GuessGrid } from '@/features/wordguess/GuessGrid';
import { GuessKeyboard } from '@/features/wordguess/GuessKeyboard';
import { rain } from '@/fx/confetti';
import { celebrate, mascotSay, queueBadges, titleReveal } from '@/fx/fxBus';
import { buzz } from '@/fx/haptics';
import { sound } from '@/fx/sound';
import type { Badge } from '@/game/progression';
import type { Tier } from '@/game/scoring';
import {
  answerPool,
  dailyAnswer,
  GUESS_RULES,
  guessPoints,
  keyboardStates,
  randomAnswer,
  scoreGuess,
  strictProblem,
  todayKey,
} from '@/game/wordguess/guess';
import type { LetterState } from '@/game/wordguess/guess';
import { recordGuessGame } from '@/store/actions';
import { useAppData } from '@/store/appStore';

const FLIP_MS = 280;
const recent: string[] = [];

const TIER_BY_TRIES: Tier[] = [
  'legendary',
  'legendary',
  'superb',
  'excellent',
  'great',
];

interface Round {
  answer: string;
  daily: string | null;
}

interface Result {
  won: boolean;
  tries: number;
  points: number;
  badges: Badge[];
}

export function WordGuessGame() {
  const { go, openCard } = useNav();
  const profile = useCurrentProfile();
  const custom = useAppData((d) => d.custom.definitions);
  const { dict } = useDictionary();

  const difficulty = profile?.prefs.difficulty ?? 'medium';
  const rules = GUESS_RULES[difficulty];
  const today = todayKey();

  const newRound = useCallback((): Round => {
    const wantsDaily =
      profile?.prefs.guessDaily && profile.stats.dailyPlayed !== today;
    if (wantsDaily) {
      return { answer: dailyAnswer(today, rules.length), daily: today };
    }
    const answer = randomAnswer(rules.length, recent);
    recent.push(answer);
    recent.splice(0, recent.length - 20);
    return { answer, daily: null };
    // Only the first render picks a daily word.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules.length]);

  const [round, setRound] = useState<Round>(newRound);
  const [guesses, setGuesses] = useState<
    { word: string; states: LetterState[] }[]
  >([]);
  const [current, setCurrent] = useState('');
  const [revealRow, setRevealRow] = useState<number | null>(null);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [bounceRow, setBounceRow] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [usedClue, setUsedClue] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(
    () => window.innerHeight
  );
  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const messageTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const done =
    result !== null ||
    guesses.length >= rules.maxGuesses ||
    guesses.some((g) => g.word === round.answer);
  const meaning = localMeaning(round.answer, custom);
  const keys = keyboardStates(guesses);
  const tileSize = Math.max(
    34,
    Math.min(
      64,
      Math.floor(330 / rules.length),
      Math.floor((viewportHeight - 330) / rules.maxGuesses) - 6
    )
  );

  const flash = (text: string) => {
    clearTimeout(messageTimer.current);
    setMessage(text);
    messageTimer.current = setTimeout(() => setMessage(null), 1800);
  };

  const reject = (text: string) => {
    setShakeRow(guesses.length);
    setTimeout(() => setShakeRow(null), 450);
    flash(text);
    sound.miss();
    buzz('miss');
  };

  const finish = (won: boolean, tries: number) => {
    if (!profile) {
      return;
    }
    const points = won ? guessPoints(difficulty, tries, usedClue) : 0;
    const rewards = recordGuessGame(profile.id, {
      word: round.answer,
      won,
      tries,
      points,
      daily: round.daily,
    });
    queueBadges(rewards.badges, won ? 1400 : 600);
    if (rewards.newTitle) {
      titleReveal(rewards.newTitle, 1800);
    }
    if (won) {
      setScore((s) => s + points);
      const row = gridRef.current?.querySelectorAll('[role="row"]')[tries - 1];
      const tiles = [...(row?.querySelectorAll('[role="gridcell"]') ?? [])].map(
        (el) => el.getBoundingClientRect()
      );
      setBounceRow(tries - 1);
      celebrate({
        word: round.answer,
        points,
        tier: TIER_BY_TRIES[tries - 1] ?? 'nice',
        color: '#2eb872',
        tiles,
        board: gridRef.current?.getBoundingClientRect() ?? new DOMRect(),
        chips: [
          round.daily ? 'Word of the day' : null,
          `Solved in ${tries}`,
          usedClue ? 'Clue used' : null,
        ].filter((c): c is string => !!c),
      });
    } else {
      mascotSay('oops', `So close! The word was ${round.answer}.`, 3500);
    }
    setTimeout(
      () => setResult({ won, tries, points, badges: rewards.badges }),
      won ? 2400 : 1200
    );
  };

  const submit = () => {
    const word = current;
    if (word.length < rules.length) {
      reject('Not enough letters');
      return;
    }
    const known = answerPool(rules.length).includes(word) || dict?.isWord(word);
    if (!known) {
      reject(dict ? 'Not in the word list' : 'Still opening the dictionary…');
      if (dict) {
        mascotSay('think', 'Hmm, I don’t know that word.', 1800);
      }
      return;
    }
    if (rules.strict) {
      const problem = strictProblem(word, guesses);
      if (problem) {
        reject(problem);
        return;
      }
    }

    const states = scoreGuess(word, round.answer);
    const next = [...guesses, { word, states }];
    setGuesses(next);
    setCurrent('');
    setRevealRow(next.length - 1);
    setBusy(true);
    states.forEach((state, i) =>
      setTimeout(
        () =>
          sound.tick(
            state === 'correct' ? 6 + i : state === 'present' ? 3 + i : i
          ),
        i * FLIP_MS + 250
      )
    );
    const revealTime = rules.length * FLIP_MS + 350;
    setTimeout(() => {
      setBusy(false);
      const won = word === round.answer;
      if (won) {
        finish(true, next.length);
      } else if (next.length >= rules.maxGuesses) {
        finish(false, next.length);
      } else if (next.length === 3 && !usedClue) {
        mascotSay('think', 'Stuck? Tap “Show clue” for a hint.', 3000);
      }
    }, revealTime);
  };

  const press = (key: string) => {
    if (done || busy) {
      return;
    }
    if (key === 'ENTER') {
      submit();
    } else if (key === 'BACK') {
      setCurrent((c) => c.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && current.length < rules.length) {
      setCurrent((c) => c + key);
      sound.tap();
    }
  };

  // Physical keyboards work too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        document.querySelector('[role="dialog"]')
      ) {
        return;
      }
      if (e.key === 'Enter') {
        press('ENTER');
      } else if (e.key === 'Backspace') {
        press('BACK');
      } else if (/^[a-z]$/i.test(e.key)) {
        press(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const playAgain = () => {
    setRound(newRound());
    setGuesses([]);
    setCurrent('');
    setRevealRow(null);
    setBounceRow(null);
    setUsedClue(false);
    setResult(null);
  };

  if (!profile) {
    return null;
  }

  const rows = [
    ...guesses.map((g) => ({ word: g.word, states: g.states })),
    ...(done ? [] : [{ word: current, states: null }]),
  ];
  const s = profile.stats;
  const maxDist = Math.max(1, ...Object.values(s.guessDist));

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-3 pt-3 pb-4 sm:px-4">
      <GameHud
        score={score}
        onQuit={() => go('setup')}
        stats={
          <span className="text-parchment-200">
            {round.daily ? 'Word of the day' : 'Practice'}
          </span>
        }
      />

      <div className="mt-3 flex items-start justify-center gap-3">
        <div className="hidden w-24 shrink-0 pt-6 sm:block">
          <Mascot className="h-28 w-24" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="relative" ref={gridRef}>
            <GuessGrid
              rows={rows}
              length={rules.length}
              maxGuesses={rules.maxGuesses}
              revealRow={revealRow}
              shakeRow={shakeRow}
              bounceRow={bounceRow}
              size={tileSize}
            />
            {message && (
              <motion.div
                className="paper absolute top-1/3 left-1/2 z-10 -translate-x-1/2 rounded-xl px-4 py-2 font-bold whitespace-nowrap"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                role="alert"
              >
                {message}
              </motion.div>
            )}
          </div>

          <div className="w-full max-w-sm">
            {usedClue && meaning ? (
              <p className="wood rounded-2xl px-4 py-2.5 text-center text-parchment-100">
                <span className="mr-1 font-bold text-gilt-300">Clue:</span>
                {meaning.definition}
              </p>
            ) : (
              <Button
                variant="wood"
                size="sm"
                className="mx-auto flex"
                onClick={() => setUsedClue(true)}
                disabled={done || !meaning}
              >
                <BookOpen className="size-4" aria-hidden /> Show clue (¾ points)
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-center pt-4">
        <GuessKeyboard states={keys} onKey={press} disabled={done || busy} />
      </div>

      <Modal
        open={!!result}
        title={result?.won ? `You got it in ${result.tries}!` : 'Nice try!'}
        className="text-center"
      >
        {result && (
          <>
            <p className="mt-1 text-ink-soft">
              {result.won ? `+${result.points} points` : 'The word was'}
            </p>
            <div className="mt-3 flex justify-center gap-1">
              {[...round.answer].map((ch, i) => (
                <span
                  key={i}
                  className="tile size-11 text-2xl"
                  data-found=""
                  style={{ ['--found' as string]: '#2eb872' }}
                >
                  {ch}
                </span>
              ))}
            </div>
            {meaning && (
              <p className="mt-3 rounded-2xl bg-white/60 px-4 py-3 text-left">
                {meaning.definition}
                {meaning.example && (
                  <span className="mt-1 block text-sm text-ink-soft italic">
                    “{meaning.example}”
                  </span>
                )}
              </p>
            )}
            <div className="mt-3 flex justify-center gap-2">
              <Button
                size="sm"
                onClick={() => speak(round.answer.toLowerCase())}
              >
                <Volume2 className="size-4" aria-hidden /> Say it
              </Button>
              <Button size="sm" onClick={() => openCard(round.answer)}>
                <BookOpen className="size-4" aria-hidden /> Word card
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ['Played', s.guessPlayed],
                ['Streak', s.guessStreak],
                ['Best streak', s.guessBestStreak],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/60 p-2">
                  <div className="text-xs text-ink-soft">{label}</div>
                  <div className="text-xl font-bold">{value}</div>
                </div>
              ))}
            </div>
            <div
              className="mt-3 text-left"
              aria-label="Wins by number of guesses"
            >
              {Array.from({ length: rules.maxGuesses }, (_, i) => {
                const n = s.guessDist[i + 1] ?? 0;
                const mine = result.won && result.tries === i + 1;
                return (
                  <div key={i} className="mt-1 flex items-center gap-2 text-sm">
                    <span className="w-3 font-bold">{i + 1}</span>
                    <span
                      className="rounded-md px-2 text-right font-bold text-white"
                      style={{
                        width: `${Math.max(8, (n / maxDist) * 100)}%`,
                        background: mine ? '#2eb872' : '#8a7560',
                      }}
                    >
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={() => go('setup')}>
                Change game
              </Button>
              <Button
                variant="gilt"
                className="flex-1"
                onClick={() => {
                  playAgain();
                  if (result.won) {
                    rain();
                  }
                }}
              >
                Play another
              </Button>
            </div>
          </>
        )}
      </Modal>
    </main>
  );
}
