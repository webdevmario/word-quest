import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { ReactNode } from 'react';

export type Screen =
  | 'home'
  | 'editor'
  | 'setup'
  | 'search'
  | 'worm'
  | 'guess'
  | 'trophies'
  | 'wordbook'
  | 'parent';

interface NavState {
  screen: Screen;
  /** The player who is currently playing. */
  profileId: string | null;
  /** Profile being edited in the editor; null means a new player. */
  editingId: string | null;
  /** The word shown in the word card, if open. */
  cardWord: string | null;
}

interface Nav extends NavState {
  go: (screen: Screen, opts?: Partial<Omit<NavState, 'screen'>>) => void;
  openCard: (word: string) => void;
  closeCard: () => void;
}

const NavContext = createContext<Nav | null>(null);

export function NavProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Partial<NavState>;
}) {
  const [state, setState] = useState<NavState>({
    screen: 'home',
    profileId: null,
    editingId: null,
    cardWord: null,
    ...initial,
  });

  const go = useCallback<Nav['go']>((screen, opts) => {
    setState((s) => ({ ...s, ...opts, screen, cardWord: null }));
    window.scrollTo?.({ top: 0 });
  }, []);
  const openCard = useCallback((word: string) => {
    setState((s) => ({ ...s, cardWord: word.toUpperCase() }));
  }, []);
  const closeCard = useCallback(() => {
    setState((s) => ({ ...s, cardWord: null }));
  }, []);

  const value = useMemo(
    () => ({ ...state, go, openCard, closeCard }),
    [state, go, openCard, closeCard]
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) {
    throw new Error('useNav must be used inside <NavProvider>');
  }
  return nav;
}
