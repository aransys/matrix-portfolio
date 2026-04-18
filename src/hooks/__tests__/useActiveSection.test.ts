import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveSection } from "../useActiveSection";

/**
 * jsdom doesn't implement IntersectionObserver, and even if it did, we want
 * to control exactly which entries fire during the test. Swap in a tiny stub
 * that remembers the callback it was constructed with and lets the test
 * drive it manually.
 */
interface StubbedObserver {
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  callback: IntersectionObserverCallback;
}

let lastObserver: StubbedObserver | null = null;

beforeEach(() => {
  lastObserver = null;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = () => [];
      // Match real IntersectionObserver getters so TS-only consumers are happy
      root = null;
      rootMargin = "";
      thresholds = [];
      constructor(cb: IntersectionObserverCallback) {
        lastObserver = {
          observe: this.observe,
          disconnect: this.disconnect,
          callback: cb,
        };
      }
    },
  );

  // Seed three fake sections so getElementById resolves something real
  // (otherwise the hook short-circuits before wiring the observer).
  for (const id of ["about", "skills", "projects"]) {
    const el = document.createElement("section");
    el.id = id;
    document.body.appendChild(el);
  }
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

/** Trigger the observer with a synthetic "section X is intersecting" entry. */
function fireIntersecting(id: string) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing fixture element: ${id}`);
  if (!lastObserver) throw new Error("observer not constructed yet");
  const entry = {
    isIntersecting: true,
    target: el,
    intersectionRatio: 1,
    boundingClientRect: {} as DOMRectReadOnly,
    intersectionRect: {} as DOMRectReadOnly,
    rootBounds: null,
    time: 0,
  } as IntersectionObserverEntry;
  act(() => {
    lastObserver!.callback(
      [entry],
      lastObserver as unknown as IntersectionObserver,
    );
  });
}

describe("useActiveSection", () => {
  it("seeds the active id with the first section before any observation fires", () => {
    const { result } = renderHook(() =>
      useActiveSection(["about", "skills", "projects"]),
    );
    expect(result.current).toBe("about");
  });

  it("updates to the id whose section becomes intersecting", () => {
    const { result } = renderHook(() =>
      useActiveSection(["about", "skills", "projects"]),
    );

    fireIntersecting("skills");
    expect(result.current).toBe("skills");

    fireIntersecting("projects");
    expect(result.current).toBe("projects");
  });

  it("wires every supplied id to the observer via .observe()", () => {
    renderHook(() => useActiveSection(["about", "skills", "projects"]));
    expect(lastObserver?.observe).toHaveBeenCalledTimes(3);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = renderHook(() =>
      useActiveSection(["about", "skills"]),
    );
    unmount();
    expect(lastObserver?.disconnect).toHaveBeenCalledTimes(1);
  });

  it("returns the seed id unchanged when no sections exist in the DOM", () => {
    document.body.innerHTML = ""; // wipe the fixture elements
    const { result } = renderHook(() => useActiveSection(["ghost"]));
    expect(result.current).toBe("ghost");
    // No observer created either — the hook should have bailed early
    expect(lastObserver).toBeNull();
  });
});
