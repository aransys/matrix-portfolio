import { useEffect } from "react";

// Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
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
];

export function useKonamiCode(callback: () => void) {
  useEffect(() => {
    let sequence: string[] = [];

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = /^[a-zA-Z]$/.test(e.key) ? e.key.toLowerCase() : e.code;
      sequence.push(key);

      if (sequence.length > KONAMI_CODE.length) {
        sequence.shift();
      }

      if (sequence.join(",") === KONAMI_CODE.join(",")) {
        callback();
        sequence = [];
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [callback]);
}

export function usePhraseDetector(phrase: string, callback: () => void) {
  useEffect(() => {
    let typed = "";
    const normalizedPhrase = phrase.toLowerCase();

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        typed += e.key.toLowerCase();

        if (typed.length > normalizedPhrase.length) {
          typed = typed.slice(-normalizedPhrase.length);
        }

        if (typed === normalizedPhrase) {
          callback();
          typed = "";
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [phrase, callback]);
}
