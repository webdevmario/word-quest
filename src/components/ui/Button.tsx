import clsx from 'clsx';
import { motion } from 'motion/react';

import type { HTMLMotionProps } from 'motion/react';

type Variant = 'gilt' | 'paper' | 'wood' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  gilt: 'bg-gradient-to-b from-gilt-200 via-gilt-300 to-gilt-400 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_3px_0_var(--color-gilt-700),0_10px_20px_-8px_rgba(0,0,0,0.6)]',
  paper:
    'bg-gradient-to-b from-parchment-50 to-parchment-200 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_3px_0_var(--color-parchment-400),0_10px_20px_-10px_rgba(0,0,0,0.6)]',
  wood: 'wood text-parchment-100',
  ghost: 'text-parchment-100 hover:bg-white/8',
};

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-3.5 text-sm gap-1.5 rounded-xl',
  md: 'h-12 px-5 text-base gap-2 rounded-2xl',
  lg: 'h-16 px-8 text-xl gap-3 rounded-[20px]',
};

export function Button({
  variant = 'paper',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={rest.disabled ? undefined : { scale: 0.95, y: 2 }}
      whileHover={rest.disabled ? undefined : { y: -1 }}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center font-bold transition-[filter] select-none disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    />
  );
}
