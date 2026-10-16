import { useCallback, useEffect, useState } from 'react';

import { loadDictionary } from '@/dictionary/dictionary';
import type { WordDictionary } from '@/dictionary/dictionary';
import { useAppData } from '@/store/appStore';

/** Loads the word list and keeps the family's allowed/blocked words applied. */
export function useDictionary() {
  const [dict, setDict] = useState<WordDictionary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const allowed = useAppData((d) => d.custom.allowed);
  const blocked = useAppData((d) => d.custom.blocked);

  useEffect(() => {
    let live = true;
    loadDictionary()
      .then((d) => live && setDict(d))
      .catch(
        () =>
          live &&
          setError(
            'The dictionary didn’t load. Check the connection and try again.'
          )
      );
    return () => {
      live = false;
    };
  }, [attempt]);

  useEffect(() => {
    dict?.setCustomWords(allowed, blocked);
  }, [dict, allowed, blocked]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  return { dict, error, retry };
}
