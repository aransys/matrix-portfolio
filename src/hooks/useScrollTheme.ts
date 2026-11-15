import { useEffect, useRef, useState } from "react";
import type { ThemeKey } from "../config/themes";

/** Which way the new colour should arrive from. */
export type ScrollDirection = "above" | "below";

export interface ScrollTheme {
  theme: ThemeKey;
  /** "below" when the change came from scrolling down, "above" from up. */
  from: ScrollDirection;
}

/**
 * The page reads as the trilogy from top to bottom: it opens in the first
 * film's green, and each of these sections starts the next film.
 */
const CHAPTERS: { sectionId: string; theme: ThemeKey }[] = [
  { sectionId: "projects", theme: "reloaded" },
  { sectionId: "timeline", theme: "revolutions" },
];
const OPENING_THEME: ThemeKey = "matrix";

/** A chapter starts when its section's top passes this far down the viewport. */
const TRIGGER_LINE = 0.6;
/** Dead zone around the line, so resting on a boundary never flickers. */
const HYSTERESIS_PX = 48;

/**
 * Theme picked by how far the visitor has scrolled. Changes only when a
 * chapter boundary is crossed, so scrolling costs one state update per
 * chapter, not one per frame. Inactive (and reporting the opening theme)
 * while `enabled` is false.
 */
export function useScrollTheme(enabled: boolean): ScrollTheme {
  const [state, setState] = useState<ScrollTheme>({ theme: OPENING_THEME, from: "below" });
  /** How many chapters have started: 0 = still in the opening theme. */
  const depth = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const line = window.innerHeight * TRIGGER_LINE;
      let next = 0;
      CHAPTERS.forEach((chapter, i) => {
        const el = document.getElementById(chapter.sectionId);
        if (!el) return;
        // Already inside this chapter: it takes a little extra to leave it.
        const slack = depth.current > i ? HYSTERESIS_PX : -HYSTERESIS_PX;
        if (el.getBoundingClientRect().top <= line + slack) next = i + 1;
      });
      if (next === depth.current) return;
      const from: ScrollDirection = next > depth.current ? "below" : "above";
      depth.current = next;
      setState({ theme: next === 0 ? OPENING_THEME : CHAPTERS[next - 1].theme, from });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled]);

  return state;
}
