import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { GEM_COLORS } from '@/game/appearance';
import { GEM_MULTIPLIER } from '@/game/wordworm/board';
import type { GemType } from '@/game/wordworm/board';

import type { ReactNode } from 'react';

const GEMS: [GemType, string, string][] = [
  ['emerald', 'E', '5 letters'],
  ['amber', 'A', '6 letters'],
  ['sapphire', 'S', '7 letters'],
  ['diamond', 'D', '8 letters'],
  ['crystal', 'C', '9+ letters'],
];

function Section({
  art,
  title,
  children,
}: {
  art: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex gap-3 border-t border-dashed border-parchment-400/60 py-3">
      <div className="flex w-16 shrink-0 items-start justify-center pt-1">
        {art}
      </div>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-ink-soft">{children}</p>
      </div>
    </section>
  );
}

/** Explains the special tiles, shown the first time a player opens Word Worm. */
export function TileGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How to play Word Worm"
      className="max-w-lg"
    >
      <div className="mt-2 max-h-[65dvh] overflow-y-auto pr-1">
        <Section
          title="Make words"
          art={
            <span className="flex gap-0.5">
              {['C', 'A', 'T'].map((l) => (
                <span
                  key={l}
                  className="tile size-5 text-xs"
                  data-selected="true"
                >
                  {l}
                </span>
              ))}
            </span>
          }
        >
          Tap letters that touch, or drag across them. Tap the last letter again
          or press Submit to send the word. Longer words score a lot more, and
          Inky gobbles them up!
        </Section>

        <Section
          title="Gem tiles"
          art={
            <span className="grid grid-cols-3 gap-0.5">
              {GEMS.map(([gem, letter]) => (
                <span
                  key={gem}
                  className="tile size-5 text-xs"
                  data-gem={gem}
                  style={{ ['--gem' as string]: GEM_COLORS[gem] }}
                >
                  {letter}
                </span>
              ))}
            </span>
          }
        >
          Long words leave a gem tile behind. Use a gem in a later word to
          multiply its points:{' '}
          {GEMS.map(
            ([gem, , length]) => `${gem} ×${GEM_MULTIPLIER[gem]} (${length})`
          ).join(', ')}
          .
        </Section>

        <Section
          title="Fire tiles"
          art={
            <span className="tile size-10 text-xl" data-fire="true">
              F
            </span>
          }
        >
          Short words can start a fire. Each turn, a fire tile burns the letter
          under it and sinks lower. If it reaches the bottom, the game ends! Use
          the fire tile in a word to put it out and earn bonus points.
        </Section>

        <Section
          title="The Qu tile"
          art={<span className="tile size-10 text-base">Qu</span>}
        >
          Q almost always comes with U, so they share one tile.
        </Section>

        <Section title="Bonus word" art={<span className="text-3xl">🎁</span>}>
          Read the clue and make the hidden word for three times the points. Its
          letters are always somewhere on the board.
        </Section>

        <Section title="Chapters" art={<span className="text-3xl">📖</span>}>
          Fill the chapter bar to reach the next chapter. You get bonus points
          and every fire goes out, but later chapters bring more fire.
        </Section>

        <Section
          title="Shuffle and hints"
          art={<span className="text-3xl">🔀</span>}
        >
          Shuffle gives you new letters (once fires have started, it costs a
          fire tile). Ask Inky shows a word you can make.
        </Section>
      </div>
      <Button variant="gilt" className="mt-4 w-full" onClick={onClose}>
        Let’s play
      </Button>
    </Modal>
  );
}
