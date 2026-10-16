import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useEffect } from 'react';

import { NavProvider, useNav } from '@/app/nav';
import type { Screen } from '@/app/nav';
import { loadDictionary } from '@/dictionary/dictionary';
import { WordCard } from '@/features/learn/WordCard';
import { HomeScreen } from '@/features/profiles/HomeScreen';
import { ProfileEditor } from '@/features/profiles/ProfileEditor';
import { SetupScreen } from '@/features/setup/SetupScreen';
import { FxLayer } from '@/fx/FxLayer';
import { setMuted } from '@/fx/sound';
import { setSafeToReload } from '@/services/pwa';
import { useAppData } from '@/store/appStore';

import type { ComponentType } from 'react';

// Game screens load on demand to keep the first load small.
const WordBookScreen = lazy(() =>
  import('@/features/learn/WordBookScreen').then((m) => ({
    default: m.WordBookScreen,
  }))
);
const ParentArea = lazy(() =>
  import('@/features/parent/ParentArea').then((m) => ({
    default: m.ParentArea,
  }))
);
const TrophyRoom = lazy(() =>
  import('@/features/trophies/TrophyRoom').then((m) => ({
    default: m.TrophyRoom,
  }))
);
const WordGuessGame = lazy(() =>
  import('@/features/wordguess/WordGuessGame').then((m) => ({
    default: m.WordGuessGame,
  }))
);
const WordSearchGame = lazy(() =>
  import('@/features/wordsearch/WordSearchGame').then((m) => ({
    default: m.WordSearchGame,
  }))
);
const WordWormGame = lazy(() =>
  import('@/features/wordworm/WordWormGame').then((m) => ({
    default: m.WordWormGame,
  }))
);

const SCREENS: Record<Screen, ComponentType> = {
  home: HomeScreen,
  editor: ProfileEditor,
  setup: SetupScreen,
  search: WordSearchGame,
  worm: WordWormGame,
  guess: WordGuessGame,
  trophies: TrophyRoom,
  wordbook: WordBookScreen,
  parent: ParentArea,
};

function Screens() {
  const { screen } = useNav();
  const muted = useAppData((d) => d.settings.muted);
  useEffect(() => setMuted(muted), [muted]);
  // Start fetching the word list early so Word Worm and Word Guess are ready.
  useEffect(() => {
    void loadDictionary().catch(() => undefined);
  }, []);
  // A new version installs only on the home screen, never mid-game.
  useEffect(() => setSafeToReload(screen === 'home'), [screen]);

  const Current = SCREENS[screen];
  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          <Suspense
            fallback={
              <p className="pt-24 text-center font-display text-xl text-parchment-200">
                Opening the book…
              </p>
            }
          >
            <Current />
          </Suspense>
        </motion.div>
      </AnimatePresence>
      <WordCard />
      <FxLayer />
    </>
  );
}

export function App() {
  return (
    <NavProvider>
      <Screens />
    </NavProvider>
  );
}
