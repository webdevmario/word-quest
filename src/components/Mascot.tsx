import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';

import { useFx } from '@/fx/fxBus';
import type { MascotMood } from '@/fx/fxBus';

import type { Variants } from 'motion/react';

const BODY: Variants = {
  idle: { y: [0, -3, 0], rotate: 0, rotateY: 0, transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  cheer: { y: [0, -18, 0, -8, 0], scaleY: [1, 1.08, 0.92, 1.04, 1], transition: { duration: 0.8 } },
  wow: { y: [0, -22, 0], rotateY: [0, 360], transition: { duration: 0.9, ease: 'easeOut' } },
  think: { rotate: -8, y: 0, transition: { type: 'spring', stiffness: 200 } },
  oops: { rotate: [0, 6, -6, 0], y: 4, transition: { duration: 0.5 } },
  chomp: { y: [0, -4, 0, -4, 0], rotate: [0, -4, 0, -4, 0], transition: { duration: 0.7 } },
}; // prettier-ignore

/** Inky, an original bookworm who lives in an old book and loves words. */
export function InkyArt({ mood }: { mood: MascotMood }) {
  const happy = mood === 'cheer' || mood === 'wow';
  return (
    <svg
      viewBox="0 0 120 130"
      className="h-full w-full overflow-visible"
      aria-hidden
    >
      {/* Book */}
      <path d="M8 104 Q60 90 112 104 L112 122 Q60 110 8 122 Z" fill="#6b2f1f" />
      <path d="M14 100 Q37 92 60 101 L60 116 Q37 108 14 115 Z" fill="#fbf2dc" />
      <path
        d="M106 100 Q83 92 60 101 L60 116 Q83 108 106 115 Z"
        fill="#f1e2bf"
      />
      <path
        d="M22 101 Q38 96 54 102 M22 106 Q38 101 54 107 M66 102 Q82 96 98 101 M66 107 Q82 101 98 106"
        stroke="#cfb07a"
        strokeWidth="1.2"
        fill="none"
      />
      <motion.g
        style={{ originX: '60px', originY: '104px' }}
        variants={BODY}
        animate={mood}
        initial="idle"
      >
        {/* Body segments */}
        <circle cx="60" cy="94" r="13" fill="#6fbf4a" />
        <circle cx="55" cy="80" r="12.5" fill="#7fcc58" />
        <circle cx="59" cy="66" r="12" fill="#8fd866" />
        <path
          d="M49 92 q11 6 22 0 M45 79 q10 6 21 0"
          stroke="#4f9a32"
          strokeWidth="1.5"
          fill="none"
          opacity=".6"
        />
        {/* Head */}
        <circle cx="62" cy="44" r="21" fill="#9be070" />
        <circle cx="48" cy="52" r="4" fill="#f59a9a" opacity=".7" />
        <circle cx="77" cy="52" r="4" fill="#f59a9a" opacity=".7" />
        {/* Glasses */}
        <g stroke="#c48f2c" strokeWidth="2.6" fill="rgba(255,255,255,.35)">
          <circle cx="54" cy="41" r="8" />
          <circle cx="71" cy="41" r="8" />
        </g>
        <path d="M62 41 h1" stroke="#c48f2c" strokeWidth="2.6" />
        {/* Eyes blink every few seconds */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.1, 1] }}
          transition={{
            duration: 4,
            times: [0, 0.92, 0.96, 1],
            repeat: Infinity,
          }}
          style={{ originY: '41px' }}
        >
          <circle
            cx={mood === 'think' ? 52 : 55}
            cy="41"
            r="3"
            fill="#2e1c10"
          />
          <circle
            cx={mood === 'think' ? 69 : 72}
            cy="41"
            r="3"
            fill="#2e1c10"
          />
        </motion.g>
        {/* Mouth */}
        {mood === 'chomp' ? (
          <motion.ellipse
            cx="62"
            cy="54"
            rx="7"
            fill="#7a2a2a"
            animate={{ ry: [6, 1, 6, 1, 6] }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />
        ) : happy ? (
          <path d="M54 52 q8 10 16 0 z" fill="#7a2a2a" />
        ) : mood === 'oops' ? (
          <path
            d="M55 56 q7 -5 14 0"
            stroke="#2e1c10"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M55 53 q7 6 14 0"
            stroke="#2e1c10"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Tuft */}
        <path d="M62 23 q-2 -9 5 -11 q-6 5 -2 11" fill="#6fbf4a" />
      </motion.g>
    </svg>
  );
}

/** Inky with a speech bubble driven by the celebration bus. */
export function Mascot({
  className,
  target,
}: {
  className?: string;
  /** Marks Inky as the place eaten letters fly to. */
  target?: boolean;
}) {
  const { mood, line, id } = useFx((s) => s.mascot);
  return (
    <div className={clsx('relative', className)}>
      <AnimatePresence>
        {line && (
          <motion.div
            key={id}
            className="paper absolute -top-2 left-1/2 z-10 w-max max-w-44 -translate-x-1/2 -translate-y-full rounded-2xl px-3 py-1.5 text-center text-sm font-bold"
            initial={{ y: 8, scale: 0.6, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            role="status"
          >
            {line}
            <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-parchment-200" />
          </motion.div>
        )}
      </AnimatePresence>
      {target && (
        <span
          data-mascot-target
          className="pointer-events-none absolute top-[42%] left-[52%] size-2"
          aria-hidden
        />
      )}
      <div className="size-full" style={{ perspective: 400 }}>
        <InkyArt mood={mood} />
      </div>
    </div>
  );
}
