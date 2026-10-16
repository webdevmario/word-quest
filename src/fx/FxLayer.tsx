import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { attachCanvas, rain, resize } from '@/fx/confetti';
import { dismissTitle, useFx } from '@/fx/fxBus';
import type { WordCelebration } from '@/fx/fxBus';
import { TIER_LABELS } from '@/game/scoring';

const TIER_SCALE = {
  nice: 0.8,
  great: 0.95,
  excellent: 1.1,
  superb: 1.25,
  legendary: 1.4,
};

/** Rotating gilt rays behind the word; bigger words get bigger rays. */
function Rays({ size, color }: { size: number; color: string }) {
  return (
    <motion.div
      aria-hidden
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: -size / 2,
        top: -size / 2,
        background: `repeating-conic-gradient(from 0deg, color-mix(in oklab, ${color} 45%, #f0cf72) 0deg 7deg, transparent 7deg 15deg)`,
        maskImage: 'radial-gradient(circle, #000 12%, transparent 66%)',
        WebkitMaskImage: 'radial-gradient(circle, #000 12%, transparent 66%)',
      }}
      initial={{ scale: 0.2, opacity: 0, rotate: 0 }}
      animate={{ scale: 1, opacity: [0, 0.9, 0.75, 0], rotate: 160 }}
      transition={{ duration: 1.8, ease: 'easeOut', times: [0, 0.15, 0.7, 1] }}
    />
  );
}

function WordBanner({ c }: { c: WordCelebration }) {
  const big = c.tier !== 'nice' && c.tier !== 'great';
  const letters = [...c.word];
  const tileSize = Math.max(28, Math.min(52, 340 / letters.length));
  return (
    <motion.div
      className="pointer-events-none fixed z-40"
      style={{ left: c.center.x, top: c.center.y }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30, transition: { duration: 0.3 } }}
    >
      {c.tier !== 'nice' && <Rays size={big ? 620 : 420} color={c.color} />}
      {/* A soft dark plate keeps the gilt lettering readable over the tiles. */}
      <motion.div
        aria-hidden
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: big ? 520 : 400,
          height: big ? 330 : 260,
          background:
            'radial-gradient(closest-side, rgb(11 31 23 / 0.88), rgb(11 31 23 / 0.6) 60%, transparent)',
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      />
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
        initial={{ scale: 0.4 }}
        animate={{ scale: TIER_SCALE[c.tier] }}
        transition={{ type: 'spring', stiffness: 380, damping: 16 }}
      >
        <motion.div
          className="gilt-text font-display text-3xl font-semibold whitespace-nowrap drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          {TIER_LABELS[c.tier]}
        </motion.div>
        <div
          className="mt-2 flex justify-center gap-1"
          style={{ perspective: 600 }}
        >
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              className="tile"
              data-selected="true"
              style={{
                width: tileSize,
                height: tileSize,
                fontSize: tileSize * 0.6,
              }}
              initial={{ rotateY: -540, scale: 0.3, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              transition={{
                delay: 0.04 * i,
                duration: 0.7,
                ease: [0.2, 0.9, 0.3, 1.15],
              }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
        <motion.div
          className="mt-2 font-sans text-4xl font-extrabold text-parchment-50 [text-shadow:0_3px_0_rgba(0,0,0,0.45)]"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ delay: 0.15 + letters.length * 0.04, duration: 0.45 }}
        >
          +{c.points.toLocaleString()}
        </motion.div>
        {c.chips.length > 0 && (
          <div className="mt-1 flex flex-wrap justify-center gap-1.5">
            {c.chips.map((chip, i) => (
              <motion.span
                key={chip}
                className="rounded-full bg-gilt-300 px-3 py-0.5 text-sm font-bold whitespace-nowrap text-ink shadow"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.1 }}
              >
                {chip}
              </motion.span>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function FxLayer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const word = useFx((s) => s.word);
  const toasts = useFx((s) => s.toasts);
  const title = useFx((s) => s.title);
  const flyers = useFx((s) => s.flyers);

  useEffect(() => {
    attachCanvas(canvas.current);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      attachCanvas(null);
    };
  }, []);

  useEffect(() => {
    if (!title) {
      return;
    }
    rain();
    const t = setTimeout(dismissTitle, 3600);
    return () => clearTimeout(t);
  }, [title]);

  return (
    <>
      <AnimatePresence>
        {word && <WordBanner key={word.id} c={word} />}
      </AnimatePresence>

      {flyers.map((f) =>
        f.kind === 'points' ? (
          <motion.div
            key={f.id}
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gilt-300 px-3 py-1 font-extrabold text-ink shadow-lg"
            initial={{ left: f.from.x, top: f.from.y, scale: 0.6, opacity: 0 }}
            animate={{
              left: [f.from.x, f.from.x, f.to.x],
              top: [f.from.y, f.from.y - 40, f.to.y],
              scale: [0.6, 1.2, 0.5],
              opacity: [0, 1, 0.9],
            }}
            transition={{
              duration: 0.85,
              times: [0, 0.3, 1],
              ease: 'easeInOut',
            }}
          >
            {f.label}
          </motion.div>
        ) : (
          <motion.div
            key={f.id}
            className="tile pointer-events-none fixed z-50 size-9 -translate-x-1/2 -translate-y-1/2 text-lg"
            data-selected="true"
            initial={{ left: f.from.x, top: f.from.y, scale: 1, opacity: 0 }}
            animate={{
              left: [f.from.x, (f.from.x + f.to.x) / 2, f.to.x],
              top: [f.from.y, Math.min(f.from.y, f.to.y) - 80, f.to.y],
              scale: [1.1, 1, 0.2],
              rotate: [0, 180, 360],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.7, delay: f.delay, ease: 'easeIn' }}
          >
            {f.label === 'QU' ? 'Qu' : f.label}
          </motion.div>
        )
      )}

      <div className="pointer-events-none fixed inset-x-0 top-[calc(4rem+var(--safe-top))] z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              className="paper flex items-center gap-3 rounded-2xl py-2 pr-5 pl-2"
              initial={{ y: -24, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              role="status"
            >
              <motion.span
                className="grid size-12 place-items-center rounded-full bg-gradient-to-b from-gilt-200 to-gilt-500 text-2xl shadow-inner"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 1080 }}
                transition={{ duration: 1.4, ease: [0.2, 0.7, 0.3, 1] }}
              >
                {t.badge.icon}
              </motion.span>
              <span>
                <span className="block text-sm text-ink-soft">
                  Badge earned
                </span>
                <span className="font-display text-lg font-semibold">
                  {t.badge.name}
                </span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {title && (
          <motion.button
            key={title.id}
            type="button"
            className="fixed inset-0 z-50 grid cursor-pointer place-items-center overflow-hidden bg-felt-950/75 backdrop-blur-sm"
            onClick={dismissTitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              aria-hidden
              className="absolute size-[160vmax] rounded-full opacity-70"
              style={{
                background:
                  'repeating-conic-gradient(#f0cf72 0deg 8deg, transparent 8deg 18deg)',
                maskImage: 'radial-gradient(circle, #000 4%, transparent 50%)',
                WebkitMaskImage:
                  'radial-gradient(circle, #000 4%, transparent 50%)',
                animation: 'rays 14s linear infinite',
              }}
            />
            <div className="relative text-center" style={{ perspective: 800 }}>
              <p className="font-display text-2xl text-gilt-200">
                You earned a new title
              </p>
              <motion.div
                className="mx-auto my-4 grid size-40 place-items-center rounded-full bg-gradient-to-b from-gilt-200 via-gilt-400 to-gilt-500 text-7xl shadow-[0_0_60px_rgba(240,207,114,0.6)] ring-4 ring-gilt-200/60"
                initial={{ rotateY: 0, scale: 0 }}
                animate={{ rotateY: 1440, scale: 1 }}
                transition={{ duration: 1.6, ease: [0.2, 0.7, 0.3, 1.1] }}
              >
                {title.title.icon}
              </motion.div>
              <p className="gilt-text font-display text-5xl font-bold sm:text-6xl">
                {title.title.name}
              </p>
              <p className="mt-4 text-parchment-200/80">Tap to keep playing</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <canvas
        ref={canvas}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] h-screen w-screen"
      />
    </>
  );
}
