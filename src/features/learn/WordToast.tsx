import { BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';

import { useNav } from '@/app/nav';
import { localMeaning } from '@/dictionary/lookup';
import { useAppData } from '@/store/appStore';

export interface ToastWord {
  id: number;
  word: string;
  isNew: boolean;
}

/**
 * Slides up after a word is found with its meaning, so every find is also a
 * tiny lesson. Tapping it opens the full word card.
 */
export function WordToast({
  item,
  onDone,
}: {
  item: ToastWord | null;
  onDone: () => void;
}) {
  const { openCard } = useNav();
  const custom = useAppData((d) => d.custom.definitions);
  const meaning = item ? localMeaning(item.word, custom) : null;

  useEffect(() => {
    if (!item) {
      return;
    }
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [item, onDone]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,var(--safe-bottom))] z-20 grid justify-items-center px-4">
      <AnimatePresence>
        {item && (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => {
              openCard(item.word);
              onDone();
            }}
            className="paper pointer-events-auto col-start-1 row-start-1 flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-left"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 26,
              delay: 0.5,
            }}
          >
            <BookOpen className="size-6 shrink-0 text-gilt-700" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="font-display text-lg font-semibold">
                  {item.word.charAt(0) + item.word.slice(1).toLowerCase()}
                </span>
                {item.isNew && (
                  <span className="rounded-full bg-emerald px-2 text-xs font-bold text-white">
                    New in your Word Book
                  </span>
                )}
              </span>
              <span className="line-clamp-2 block text-sm text-ink-soft">
                {meaning ? meaning.definition : 'Tap to see what it means.'}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
