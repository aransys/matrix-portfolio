import { useEffect } from "react";

/** Konami code: ↑ ↑ ↓ ↓ ← → ← → B A */
const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

/** Listen for the Konami cheat code and fire `callback` when entered. */
export function useKonamiCode(callback: () => void) {
  useEffect(() => {
    let sequence: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = /^[a-zA-Z]$/.test(e.key) ? e.key.toLowerCase() : e.code;
      sequence.push(key);
      if (sequence.length > KONAMI_CODE.length) sequence.shift();
      if (sequence.join(",") === KONAMI_CODE.join(",")) {
        callback();
        sequence = [];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callback]);
}
