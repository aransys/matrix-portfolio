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

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Listen for any of a set of phrases being typed anywhere on the page.
 * Ignores keystrokes aimed at form fields and keys pressed with Ctrl/Cmd.
 *
 * Maintains a rolling buffer the size of the longest phrase. On each
 * keystroke, every phrase is checked against the suffix of the buffer.
 * This is O(phrases × longestPhrase) per keystroke — fine for portfolio
 * scale (a handful of phrases) and saves us from N separate listeners.
 */
export function usePhraseDispatcher(
  phrases: Record<string, () => void>,
): void {
  useEffect(() => {
    const entries = Object.entries(phrases).map(([phrase, cb]) => ({
      phrase: phrase.toLowerCase(),
      cb,
    }));
    const longest = entries.reduce((m, e) => Math.max(m, e.phrase.length), 0);
    if (longest === 0) return;

    let typed = "";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
      if (isEditableTarget(e.target)) return;
      typed += e.key.toLowerCase();
      if (typed.length > longest) typed = typed.slice(-longest);

      for (const { phrase, cb } of entries) {
        if (typed.endsWith(phrase)) {
          cb();
          typed = "";
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phrases]);
}

/**
 * Backwards-compatible single-phrase detector. Built on top of the
 * dispatcher so the wiring stays consistent.
 */
export function usePhraseDetector(phrase: string, callback: () => void) {
  useEffect(() => {
    const map: Record<string, () => void> = { [phrase.toLowerCase()]: callback };
    let typed = "";
    const target = phrase.toLowerCase();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
      if (isEditableTarget(e.target)) return;
      typed += e.key.toLowerCase();
      if (typed.length > target.length) typed = typed.slice(-target.length);
      if (typed === target) {
        map[target]();
        typed = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phrase, callback]);
}
