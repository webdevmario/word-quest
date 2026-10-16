import { Volume2, Mic } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useNav } from '@/app/nav';
import { useCurrentProfile } from '@/app/useCurrentProfile';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { localMeaning, onlineMeaning } from '@/dictionary/lookup';
import type { WordMeaning } from '@/dictionary/lookup';
import { canSpeak, speak, speakAndSpell } from '@/dictionary/speech';
import { queueBadges } from '@/fx/fxBus';
import { noteCardOpened } from '@/store/actions';
import { useAppData } from '@/store/appStore';

type Status = 'ready' | 'loading' | 'missing';

/** Shows the example sentence with the word itself in bold. */
function Example({ text, word }: { text: string; word: string }) {
  const stem = word.toLowerCase().slice(0, Math.max(3, word.length - 2));
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase().startsWith(stem) ? <b key={i}>{part}</b> : part
      )}
    </>
  );
}

export function WordCard() {
  const { cardWord, closeCard } = useNav();
  const profile = useCurrentProfile();
  const custom = useAppData((d) => d.custom.definitions);
  const [online, setOnline] = useState<{
    word: string;
    meaning: WordMeaning | null;
  } | null>(null);

  const local = cardWord ? localMeaning(cardWord, custom) : null;
  const meaning = local ?? (online?.word === cardWord ? online.meaning : null);
  const status: Status = meaning
    ? 'ready'
    : online?.word === cardWord
      ? 'missing'
      : 'loading';

  useEffect(() => {
    if (!cardWord) {
      return;
    }
    if (profile) {
      queueBadges(noteCardOpened(profile.id).badges, 400);
    }
    if (localMeaning(cardWord, custom)) {
      return;
    }
    let cancelled = false;
    void onlineMeaning(cardWord).then((m) => {
      if (!cancelled) {
        setOnline({ word: cardWord, meaning: m });
      }
    });
    return () => {
      cancelled = true;
    };
    // Only when a new card opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardWord]);

  const times =
    cardWord && profile ? (profile.wordBook[cardWord]?.count ?? 0) : 0;
  const display = cardWord
    ? cardWord.charAt(0) + cardWord.slice(1).toLowerCase()
    : '';

  return (
    <Modal open={!!cardWord} onClose={closeCard} title={display} hideTitle>
      {cardWord && (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-5xl font-semibold tracking-tight">
                {display}
              </p>
              <p className="mt-1 text-lg text-ink-soft">
                {meaning?.syllables && (
                  <span className="mr-3">{meaning.syllables}</span>
                )}
                {meaning?.partOfSpeech && (
                  <span className="rounded-full bg-parchment-300/60 px-2.5 py-0.5 text-sm font-bold">
                    {meaning.partOfSpeech}
                  </span>
                )}
              </p>
            </div>
            {canSpeak() && (
              <div className="flex shrink-0 flex-col gap-2">
                <Button
                  size="sm"
                  variant="gilt"
                  onClick={() => speak(cardWord.toLowerCase())}
                >
                  <Volume2 className="size-4" aria-hidden /> Say it
                </Button>
                <Button size="sm" onClick={() => speakAndSpell(cardWord)}>
                  <Mic className="size-4" aria-hidden /> Spell it
                </Button>
              </div>
            )}
          </div>

          {meaning && meaning.baseWord !== cardWord && (
            <p className="mt-3 text-sm text-ink-soft">
              A form of <b>{meaning.baseWord.toLowerCase()}</b>
            </p>
          )}

          <div className="mt-4 rounded-2xl bg-white/60 p-4">
            {status === 'loading' && (
              <p className="text-ink-soft">Looking it up…</p>
            )}
            {status === 'missing' && (
              <p className="text-ink-soft">
                There’s no meaning saved for this word yet. A grown-up can add
                one in Grown-ups → Word lists.
              </p>
            )}
            {meaning && (
              <>
                <p className="text-xl leading-relaxed">{meaning.definition}</p>
                {meaning.example && (
                  <p className="mt-3 text-lg text-ink-soft italic">
                    “<Example text={meaning.example} word={meaning.baseWord} />”
                  </p>
                )}
                {canSpeak() && (
                  <button
                    type="button"
                    className="mt-3 text-sm font-bold text-gilt-700 underline-offset-4 hover:underline"
                    onClick={() =>
                      speak(
                        `${meaning.definition} ${meaning.example ?? ''}`,
                        0.9
                      )
                    }
                  >
                    Read the meaning to me
                  </button>
                )}
              </>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <span>
              {times > 0
                ? `Found ${times} ${times === 1 ? 'time' : 'times'}, saved in your Word Book`
                : 'Not in your Word Book yet'}
            </span>
            {meaning?.source === 'online' && (
              <span>From an online dictionary</span>
            )}
            {meaning?.source === 'parent' && <span>Written by a grown-up</span>}
          </div>

          <Button variant="paper" className="mt-5 w-full" onClick={closeCard}>
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
}
