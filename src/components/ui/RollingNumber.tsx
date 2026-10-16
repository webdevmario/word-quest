import { motion, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

/** A number that rolls up to its new value and gives a little bump. */
export function RollingNumber({
  value,
  delay = 450,
}: {
  value: number;
  delay?: number;
}) {
  const spring = useSpring(value, { stiffness: 70, damping: 18 });
  const text = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const [bumps, setBumps] = useState(0);
  const previous = useRef(value);

  useEffect(() => {
    if (value === previous.current) {
      return;
    }
    const grew = value > previous.current;
    previous.current = value;
    const t = setTimeout(() => {
      spring.set(value);
      if (grew) {
        setBumps((b) => b + 1);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay, spring]);

  return (
    <motion.span
      key={bumps}
      className="inline-block tabular-nums"
      initial={bumps ? { scale: 1.35 } : false}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 12 }}
    >
      <motion.span>{text}</motion.span>
    </motion.span>
  );
}
