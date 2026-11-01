"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * A hook that returns a debounced version of the provided callback function.
 * The debounced function will only execute after the specified delay has passed
 * since the last time it was called.
 *
 * @param callback - The function to debounce
 * @param deps - Dependencies array (same as useCallback)
 * @param delay - The delay in milliseconds (default: 500)
 * @returns A debounced version of the callback function
 */
export const useDebounceCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  delay: number = 500,
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [delay, ...deps],
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array means this effect runs only on mount and unmount

  return debouncedCallback;
};
