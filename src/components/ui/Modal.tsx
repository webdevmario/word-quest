import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef } from 'react';

import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  /** Hide the visible heading but keep it for screen readers. */
  hideTitle?: boolean;
  children: ReactNode;
  className?: string;
}

/** A parchment dialog. Escape and the backdrop close it when onClose is set. */
export function Modal({
  open,
  onClose,
  title,
  hideTitle,
  children,
  className,
}: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.activeElement as HTMLElement | null;
    panel.current
      ?.querySelector<HTMLElement>('button, input, textarea, [tabindex]')
      ?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-felt-950/70 p-4 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))] backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose?.();
            }
          }}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={clsx(
              'paper relative w-full max-w-md rounded-[28px] p-6',
              className
            )}
            initial={{ y: 40, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <h2
              id={titleId}
              className={clsx(
                'font-display text-2xl font-semibold',
                hideTitle && 'sr-only'
              )}
            >
              {title}
            </h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
