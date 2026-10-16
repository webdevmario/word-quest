import clsx from 'clsx';

interface BookCoverProps {
  name: string;
  avatar: string;
  color: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'w-14 h-[72px] text-2xl',
  md: 'w-24 h-32 text-4xl',
  lg: 'w-40 h-52 text-6xl',
};

/** A small cloth-bound book with the player's buddy stamped in gilt. */
export function BookCover({
  name,
  avatar,
  color,
  className,
  size = 'md',
}: BookCoverProps) {
  return (
    <div
      className={clsx(
        'relative shrink-0 rounded-l-sm rounded-r-lg',
        SIZES[size],
        className
      )}
      style={{
        background: `linear-gradient(90deg, color-mix(in oklab, ${color} 70%, black) 0 9%, color-mix(in oklab, ${color} 85%, white) 9% 11%, ${color} 11%), ${color}`,
        boxShadow:
          'inset -6px 0 12px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.08), 4px 6px 0 rgba(0,0,0,.25), 0 14px 24px -10px rgba(0,0,0,.7)',
      }}
      aria-hidden
    >
      <div className="absolute inset-[10%_8%_10%_18%] rounded-sm border border-gilt-300/50" />
      <div className="absolute inset-0 grid place-items-center pl-[10%]">
        <span className="grid aspect-square w-[58%] place-items-center rounded-full bg-gradient-to-b from-gilt-200 to-gilt-500 shadow-[inset_0_2px_3px_rgba(255,255,255,.6),0_2px_4px_rgba(0,0,0,.4)]">
          <span className="leading-none">{avatar}</span>
        </span>
      </div>
      <span className="sr-only">{name}</span>
    </div>
  );
}
