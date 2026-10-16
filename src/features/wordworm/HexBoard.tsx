import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { GEM_COLORS } from '@/game/appearance';
import { letterValue } from '@/game/scoring';
import type { Board, Pos } from '@/game/wordworm/board';

import type { PointerEvent as ReactPointerEvent } from 'react';

interface HexBoardProps {
  board: Board;
  path: Pos[];
  hintIds: ReadonlySet<number>;
  shake: boolean;
  disabled: boolean;
  onPointerDown: (pos: Pos, e: ReactPointerEvent<HTMLDivElement>) => void;
  onDragOver: (pos: Pos) => void;
  onPointerUp: () => void;
}

/** Measures the board's width so tiles can be positioned in pixels. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry?.contentRect.width ?? 0)
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * The Word Worm board. Odd columns sit half a tile lower. Tiles are keyed by
 * id, so when tiles are used the ones above slide down and new ones drop in.
 */
export function HexBoard({
  board,
  path,
  hintIds,
  shake,
  disabled,
  onPointerDown,
  onDragOver,
  onPointerUp,
}: HexBoardProps) {
  const [ref, width] = useWidth();
  const t = width / board.cols;
  const gap = Math.max(2, t * 0.06);
  const selected = new Map(path.map((p, i) => [`${p.c}-${p.r}`, i] as const));

  const posFromPoint = (x: number, y: number): Pos | null => {
    const el = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>('[data-pos]');
    if (!el) {
      return null;
    }
    // Only count the middle of a tile so diagonal drags don't clip corners.
    const r = el.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2);
    const dy = y - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) > r.width * 0.42) {
      return null;
    }
    const [c, row] = (el.dataset.pos ?? '').split('-').map(Number);
    return { c: c as number, r: row as number };
  };

  return (
    <div className="tray w-full max-w-[480px]">
      <motion.div
        ref={ref}
        className="relative w-full touch-none select-none"
        style={{ height: t * (board.rows + 0.5) }}
        animate={shake ? { x: [0, -8, 8, -5, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        onPointerDown={(e) => {
          if (disabled) {
            return;
          }
          const pos = posFromPoint(e.clientX, e.clientY);
          if (pos) {
            e.currentTarget.setPointerCapture(e.pointerId);
            onPointerDown(pos, e);
          }
        }}
        onPointerMove={(e) => {
          if (e.buttons === 0 && e.pointerType === 'mouse') {
            return;
          }
          const pos = posFromPoint(e.clientX, e.clientY);
          if (pos) {
            onDragOver(pos);
          }
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="grid"
        aria-label="Word Worm letter tiles"
      >
        {width > 0 && (
          <AnimatePresence initial={false}>
            {board.columns.flatMap((col, c) =>
              col.map((tile, r) => {
                const x = c * t;
                const y = (r + (c % 2 ? 0.5 : 0)) * t;
                const order = selected.get(`${c}-${r}`);
                const label = tile.letter === 'QU' ? 'Qu' : tile.letter;
                return (
                  <motion.div
                    key={tile.id}
                    data-pos={`${c}-${r}`}
                    data-tile-id={tile.id}
                    role="gridcell"
                    aria-label={`${label}${tile.fire ? ', on fire' : ''}${tile.gem ? `, ${tile.gem} gem` : ''}${order !== undefined ? ', selected' : ''}`}
                    className="tile absolute"
                    data-selected={order !== undefined ? 'true' : undefined}
                    data-gem={tile.gem ?? undefined}
                    data-fire={tile.fire ? 'true' : undefined}
                    data-hint={hintIds.has(tile.id) ? 'true' : undefined}
                    style={{
                      width: t - gap,
                      height: t - gap,
                      left: 0,
                      top: 0,
                      fontSize:
                        (t - gap) * (tile.letter.length > 1 ? 0.46 : 0.58),
                      ['--gem' as string]: tile.gem
                        ? GEM_COLORS[tile.gem]
                        : undefined,
                    }}
                    initial={{ x, y: y - t * 2.2, opacity: 0, scale: 0.8 }}
                    animate={{ x, y, opacity: 1, scale: 1, rotate: 0 }}
                    exit={{
                      scale: [1, 1.35, 0],
                      rotate: 200,
                      opacity: [1, 1, 0],
                      transition: { duration: 0.45 },
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 520,
                      damping: 34,
                      mass: 0.9,
                    }}
                  >
                    {label}
                    <span
                      className="pointer-events-none absolute right-[9%] bottom-[5%] font-sans font-extrabold opacity-55"
                      style={{ fontSize: (t - gap) * 0.18 }}
                      aria-hidden
                    >
                      {letterValue(tile.letter)}
                    </span>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
