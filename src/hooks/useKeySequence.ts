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

/** Listen for the Konami cheat code and fire `callback` when it's entered. */
export function useKonamiCode(callback: () => void) {
  useEffect(() => {
    let sequence: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callback]);
}

/** Don't count keystrokes aimed at form fields or contenteditable elements. */
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
 * Listen for a case-insensitive phrase being typed anywhere in the page.
 * Ignores keys pressed with Ctrl/Cmd and keystrokes inside inputs/textareas.
 */
export function usePhraseDetector(phrase: string, callback: () => void) {
  useEffect(() => {
    let typed = "";
    const normalized = phrase.toLowerCase();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
      if (isEditableTarget(e.target)) return;

      typed += e.key.toLowerCase();
      if (typed.length > normalized.length) {
        typed = typed.slice(-normalized.length);
      }

      if (typed === normalized) {
        callback();
        typed = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phrase, callback]);
}
