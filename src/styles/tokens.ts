import type { CSSProperties } from "react";
import type { Theme } from "../config/themes";

/**
 * Amber accent used for non-critical attention cues — "warn" lines in the
 * terminal boot, and the "currently learning" skill group header. Kept
 * theme-independent so the signal stays consistent across palettes.
 */
export const WARN_ACCENT = "#ffaa00";

export interface CardStyleOptions {
  /** Inner padding. Defaults to a responsive clamp — 20px on phones → 32px on desktop. */
  padding?: number | string;
}

/** Translucent dark card used inside most sections. */
export function cardStyle(
  theme: Theme,
  {
    // Defaults to a continuous clamp so every card shrinks gracefully on
    // phones without needing a breakpoint at each call site.
    padding = "clamp(20px, 2vw + 16px, 32px)",
  }: CardStyleOptions = {},
): CSSProperties {
  return {
    background: "rgba(0,0,0,0.75)",
    border: `1px solid ${theme.darkDim}`,
    borderRadius: 8,
    padding,
    backdropFilter: "blur(8px)",
  };
}
