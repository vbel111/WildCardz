import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Counts down from `seconds` while `running` is true.
 * Calls `onDone` once when it reaches zero.
 */
export function useCountdown(seconds: number, running: boolean, onDone?: () => void, onTick?: (left: number) => void) {
  const [left, setLeft] = useState(seconds);
  const done = useRef(onDone);
  const tick = useRef(onTick);
  done.current = onDone;
  tick.current = onTick;

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const t = setInterval(() => {
      setLeft((l) => {
        const next = l - 1;
        if (next <= 0) {
          clearInterval(t);
          setTimeout(() => done.current?.(), 0);
          return 0;
        }
        tick.current?.(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, seconds]);

  const reset = useCallback((s: number = seconds) => setLeft(s), [seconds]);
  return { left, reset };
}

export const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
