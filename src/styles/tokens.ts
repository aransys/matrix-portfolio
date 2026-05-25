import type { CSSProperties } from "react";
import type { Theme } from "../config/themes";

/**
 * Amber accent for non-critical attention cues — kept theme-independent so
 * the "warn" signal stays consistent across all three palettes.
 */
export const WARN_ACCENT = "#ffaa00";

/**
 * Status green for the "DEPLOYED" project pip — also kept theme-independent
 * so deployment status doesn't shift with the palette.
 */
export const STATUS_GREEN = "#28c940";

export interface CardStyleOptions {
  padding?: number | string;
  raised?: boolean;
}

/**
 * Reusable glass card style. Reads CSS variables so theme switches don't
 * have to re-render the components that use it — the browser repaints the
 * surface, border, and shadow on its own.
 */
export function cardStyle(
  _theme: Theme,
  {
    padding = "clamp(20px, 2vw + 16px, 32px)",
    raised = false,
  }: CardStyleOptions = {},
): CSSProperties {
  return {
    background: raised ? "var(--c-surface-raised)" : "var(--c-surface)",
    border: "1px solid var(--c-border)",
    borderRadius: "var(--r-md)",
    padding,
    backdropFilter: "blur(12px) saturate(140%)",
    WebkitBackdropFilter: "blur(12px) saturate(140%)",
    transition:
      "var(--transition-theme), border-color 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out)",
  };
}
