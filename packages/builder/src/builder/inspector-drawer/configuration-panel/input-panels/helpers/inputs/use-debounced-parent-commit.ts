import { useCallback, useEffect, useRef } from "react";

/**
 * Batches commits to a parent callback: immediate when delayMs <= 0,
 * otherwise emits after `delayMs` of quiet time. Call `flush()` on blur/unmount
 * or gesture end so the latest value is committed without waiting.
 */
export function useDebouncedParentCommit<T>({
  delayMs,
  commit,
}: {
  delayMs: number;
  commit: (value: T) => void;
}) {
  const commitRef = useRef(commit);
  commitRef.current = commit;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<T | undefined>(undefined);

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    cancelTimer();
    if (latestRef.current !== undefined) {
      commitRef.current(latestRef.current);
      latestRef.current = undefined;
    }
  }, [cancelTimer]);

  /** Drop queued commits without notifying parent (e.g. external `defaultValue` replaced props). */
  const discardPending = useCallback(() => {
    cancelTimer();
    latestRef.current = undefined;
  }, [cancelTimer]);

  const schedule = useCallback(
    (value: T) => {
      if (delayMs <= 0) {
        cancelTimer();
        latestRef.current = undefined;
        commitRef.current(value);
        return;
      }

      latestRef.current = value;
      cancelTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (latestRef.current !== undefined) {
          commitRef.current(latestRef.current);
          latestRef.current = undefined;
        }
      }, delayMs);
    },
    [delayMs, cancelTimer],
  );

  useEffect(
    () => () => {
      cancelTimer();
      if (delayMs > 0 && latestRef.current !== undefined) {
        commitRef.current(latestRef.current as T);
        latestRef.current = undefined;
      }
    },
    [cancelTimer, delayMs],
  );

  return { schedule, flush, discardPending };
}
