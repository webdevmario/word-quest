import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';

import { NavProvider, useNav } from '@/app/nav';
import type { Screen } from '@/app/nav';
import { WordBookScreen } from '@/features/learn/WordBookScreen';
import { WordCard } from '@/features/learn/WordCard';
import { ParentArea } from '@/features/parent/ParentArea';
import { HomeScreen } from '@/features/profiles/HomeScreen';
import { ProfileEditor } from '@/features/profiles/ProfileEditor';
import { SetupScreen } from '@/features/setup/SetupScreen';
import { TrophyRoom } from '@/features/trophies/TrophyRoom';
import { WordSearchGame } from '@/features/wordsearch/WordSearchGame';
import { WordWormGame } from '@/features/wordworm/WordWormGame';
import { FxLayer } from '@/fx/FxLayer';
import { setMuted } from '@/fx/sound';
import { useAppData } from '@/store/appStore';

import type { ComponentType } from 'react';

const SCREENS: Record<Screen, ComponentType> = {
  home: HomeScreen,
  editor: ProfileEditor,
  setup: SetupScreen,
  search: WordSearchGame,
  worm: WordWormGame,
  trophies: TrophyRoom,
  wordbook: WordBookScreen,
  parent: ParentArea,
};

function Screens() {
  const { screen } = useNav();
  const muted = useAppData((d) => d.settings.muted);
  useEffect(() => setMuted(muted), [muted]);

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
          <Current />
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
