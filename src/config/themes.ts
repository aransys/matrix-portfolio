/**
 * Theme system — three palettes inspired by the colour grading of each
 * Matrix film. Every theme exposes the same shape so components only care
 * about token names, never which film is active.
 *
 * Each theme contributes both:
 *   - a rich object (used in JS/TSX for inline styles and the rain canvas)
 *   - a flat record of CSS custom properties (applied to :root once)
 *
 * The CSS variable layer is what makes scanlines, glass surfaces, and the
 * focus ring repaint instantly on theme switch — without a single React
 * re-render touching them.
 */

export interface Theme {
  /** Human-readable label used in the switcher + command palette */
  name: string;
  /** Short tagline shown beside the swatch */
  tagline: string;
  /** Year the film released — used for the timeline easter egg */
  year: string;

  // Hero accent ramp — light → dark
  primary: string;
  accent: string;
  secondary: string;
  dim: string;
  darkDim: string;

  // Surfaces
  bg: string;
  bgDeep: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;

  // Atmosphere
  glow: string;
  glowSoft: string;
  scanline: string;
  pillBg: string;

  // Matrix rain ramp — head → trail
  rainHead: string;
  rainBright: string;
  rainBody: string;
  rainDim: string;

  // Gradient used for hero backdrop wash
  gradient: string;
}

export type ThemeKey = "matrix" | "reloaded" | "revolutions";

export const THEMES: Record<ThemeKey, Theme> = {
  matrix: {
    name: "Matrix",
    tagline: "1999 · Source",
    year: "1999",
    primary: "#00ff66",
    accent: "#7fffaf",
    secondary: "#00cc55",
    dim: "#00aa3a",
    darkDim: "#005a20",
    bg: "#020604",
    bgDeep: "#000200",
    surface: "rgba(6, 18, 10, 0.72)",
    surfaceRaised: "rgba(10, 26, 14, 0.86)",
    border: "rgba(0, 255, 102, 0.18)",
    borderStrong: "rgba(0, 255, 102, 0.35)",
    glow: "rgba(0, 255, 102, 0.45)",
    glowSoft: "rgba(0, 255, 102, 0.08)",
    scanline: "rgba(0, 255, 102, 0.05)",
    pillBg: "rgba(0, 255, 102, 0.12)",
    rainHead: "#dffff0",
    rainBright: "#7cffb2",
    rainBody: "#00ff66",
    rainDim: "#005a20",
    gradient:
      "radial-gradient(ellipse at top, rgba(0, 255, 102, 0.10) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(0, 110, 50, 0.07) 0%, transparent 50%)",
  },
  reloaded: {
    name: "Reloaded",
    tagline: "2003 · Architect",
    year: "2003a",
    primary: "#5cb4ff",
    accent: "#bfe2ff",
    secondary: "#4a8edc",
    dim: "#3568a8",
    darkDim: "#1a3a70",
    bg: "#020610",
    bgDeep: "#000208",
    surface: "rgba(8, 14, 32, 0.72)",
    surfaceRaised: "rgba(12, 22, 48, 0.86)",
    border: "rgba(92, 180, 255, 0.20)",
    borderStrong: "rgba(92, 180, 255, 0.38)",
    glow: "rgba(92, 180, 255, 0.45)",
    glowSoft: "rgba(92, 180, 255, 0.08)",
    scanline: "rgba(92, 180, 255, 0.05)",
    pillBg: "rgba(92, 180, 255, 0.12)",
    rainHead: "#eef6ff",
    rainBright: "#9cd0ff",
    rainBody: "#5cb4ff",
    rainDim: "#1a3a70",
    gradient:
      "radial-gradient(ellipse at top, rgba(92, 180, 255, 0.12) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgba(40, 90, 180, 0.08) 0%, transparent 50%)",
  },
  revolutions: {
    name: "Revolutions",
    tagline: "2003 · Machine City",
    year: "2003b",
    primary: "#ffb04a",
    accent: "#ffd99a",
    secondary: "#dd8a2a",
    dim: "#b86b1a",
    darkDim: "#6a3f0a",
    bg: "#0a0604",
    bgDeep: "#040200",
    surface: "rgba(22, 12, 4, 0.72)",
    surfaceRaised: "rgba(34, 18, 6, 0.86)",
    border: "rgba(255, 176, 74, 0.20)",
    borderStrong: "rgba(255, 176, 74, 0.38)",
    glow: "rgba(255, 176, 74, 0.45)",
    glowSoft: "rgba(255, 176, 74, 0.08)",
    scanline: "rgba(255, 176, 74, 0.05)",
    pillBg: "rgba(255, 176, 74, 0.12)",
    rainHead: "#fff6e0",
    rainBright: "#ffd99a",
    rainBody: "#ffb04a",
    rainDim: "#6a3f0a",
    gradient:
      "radial-gradient(ellipse at top, rgba(255, 176, 74, 0.12) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(190, 100, 30, 0.08) 0%, transparent 50%)",
  },
};

/**
 * Flatten a theme into the CSS custom properties applied to :root.
 * Keeping this in one place means global.css and any future component can
 * trust the variable names and not duplicate the mapping.
 */
export function themeToCssVars(theme: Theme): Record<string, string> {
  return {
    "--c-primary": theme.primary,
    "--c-accent": theme.accent,
    "--c-secondary": theme.secondary,
    "--c-dim": theme.dim,
    "--c-dark-dim": theme.darkDim,
    "--c-bg": theme.bg,
    "--c-bg-deep": theme.bgDeep,
    "--c-surface": theme.surface,
    "--c-surface-raised": theme.surfaceRaised,
    "--c-border": theme.border,
    "--c-border-strong": theme.borderStrong,
    "--c-glow": theme.glow,
    "--c-glow-soft": theme.glowSoft,
    "--c-scanline": theme.scanline,
    "--c-pill-bg": theme.pillBg,
    "--c-gradient": theme.gradient,
  };
}

export const THEME_ORDER: ThemeKey[] = ["matrix", "reloaded", "revolutions"];
