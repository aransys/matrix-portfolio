import type { EggKey } from "../config/commands";

/** The action surface `EasterEggs` publishes on `window.__matrixEggs`. */
export interface EggBridge {
  triggerEgg: (key: EggKey) => void;
  toggleEgg: (key: EggKey) => void;
  showMessage: (msg: string, durationMs?: number) => void;
}

/** The live egg bridge, or undefined before `EasterEggs` has mounted. */
export function eggBridge(): EggBridge | undefined {
  return (window as unknown as { __matrixEggs?: EggBridge }).__matrixEggs;
}

/** Event the hero listens to: open the shell drawer and bring it into view. */
export const OPEN_SHELL_EVENT = "ransys:open-shell";

export function openShell(): void {
  window.dispatchEvent(new Event(OPEN_SHELL_EVENT));
}

/** Event the rain listens to: `detail` is the bend strength, 0–1. */
export const RAIN_BEND_EVENT = "ransys:rain-bend";

export function bendRain(strength: number): void {
  window.dispatchEvent(new CustomEvent<number>(RAIN_BEND_EVENT, { detail: strength }));
}
