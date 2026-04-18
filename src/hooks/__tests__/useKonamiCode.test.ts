import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useKonamiCode } from "../useKeySequence";

/** The full cheat sequence, using the event.key values the hook normalises on. */
const KONAMI_KEYS = [
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

function press(key: string) {
  // Browsers populate both e.key and e.code on real keydowns; the hook reads
  // e.code for non-letter keys (ArrowUp etc.). KeyboardEvent's constructor
  // won't derive code from key, so we have to set it ourselves.
  const init: KeyboardEventInit = { key };
  if (!/^[a-zA-Z]$/.test(key)) init.code = key;
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", init));
  });
}

describe("useKonamiCode", () => {
  afterEach(() => {
    // Each test mounts its own hook, so no cross-test state — but be explicit.
    vi.restoreAllMocks();
  });

  it("fires the callback when the full sequence is entered", () => {
    const cb = vi.fn();
    renderHook(() => useKonamiCode(cb));

    for (const k of KONAMI_KEYS) press(k);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not fire on an incorrect sequence", () => {
    const cb = vi.fn();
    renderHook(() => useKonamiCode(cb));

    // Wrong letter at the very end
    for (const k of KONAMI_KEYS.slice(0, -1)) press(k);
    press("c");

    expect(cb).not.toHaveBeenCalled();
  });

  it("recovers after a miss and fires on the next valid run", () => {
    const cb = vi.fn();
    renderHook(() => useKonamiCode(cb));

    press("x"); // junk key — should just push onto the rolling buffer
    for (const k of KONAMI_KEYS) press(k);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("is case-insensitive for the final letters", () => {
    const cb = vi.fn();
    renderHook(() => useKonamiCode(cb));

    for (const k of KONAMI_KEYS.slice(0, -2)) press(k);
    press("B"); // capital — should normalise to "b"
    press("A"); // capital — should normalise to "a"

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("unbinds the listener on unmount", () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useKonamiCode(cb));

    unmount();
    for (const k of KONAMI_KEYS) press(k);

    expect(cb).not.toHaveBeenCalled();
  });
});
