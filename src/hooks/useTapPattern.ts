import { useCallback, useRef } from "react";

/**
 * Touch-friendly equivalent of typing a phrase. Returns a tap handler
 * that fires `callback` after the user taps the target N times within
 * `windowMs`. Resets the counter if the gap between taps exceeds the
 * window.
 *
 * Used on the hero name as a mobile trigger for the pill choice egg —
 * gives phones a discoverable secret that doesn't need a keyboard.
 */
export function useTapPattern(
  count: number,
  callback: () => void,
  windowMs = 800,
): () => void {
  const tapsRef = useRef<number[]>([]);
  return useCallback(() => {
    const now = performance.now();
    tapsRef.current.push(now);
    // Drop any taps older than the window
    tapsRef.current = tapsRef.current.filter((t) => now - t <= windowMs);
    if (tapsRef.current.length >= count) {
      tapsRef.current = [];
      callback();
    }
  }, [count, callback, windowMs]);
}
