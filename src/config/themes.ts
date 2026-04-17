export interface Theme {
  name: string;
  primary: string;
  secondary: string;
  dim: string;
  darkDim: string;
  warn: string;
  bg: string;
  bgCard: string;
  bgCardBorder: string;
  accent: string;
  pill: string;
  pillBg: string;
  scanline: string;
  glowSoft: string;
}

export type ThemeKey = "matrix" | "reloaded" | "revolutions";

export const THEMES: Record<ThemeKey, Theme> = {
  matrix: {
    name: "Matrix",
    primary: "#00ff41",
    secondary: "#00cc55",
    dim: "#00aa2a",
    darkDim: "#007a1e",
    warn: "#ffaa00",
    bg: "#0a0a0a",
    bgCard: "#0d1a0f",
    bgCardBorder: "#0f2a14",
    accent: "#33ff77",
    pill: "#00ff41",
    pillBg: "rgba(0,255,65,0.1)",
    scanline: "rgba(0,255,65,0.03)",
    glowSoft: "rgba(0,255,65,0.08)",
  },
  reloaded: {
    name: "Reloaded",
    primary: "#4499ff",
    secondary: "#3377cc",
    dim: "#2266aa",
    darkDim: "#1a4f80",
    warn: "#ffdd44",
    bg: "#060a12",
    bgCard: "#0a1225",
    bgCardBorder: "#122040",
    accent: "#66bbff",
    pill: "#4499ff",
    pillBg: "rgba(68,153,255,0.1)",
    scanline: "rgba(68,153,255,0.03)",
    glowSoft: "rgba(68,153,255,0.08)",
  },
  revolutions: {
    name: "Revolutions",
    primary: "#ff9922",
    secondary: "#cc7718",
    dim: "#aa6615",
    darkDim: "#804c10",
    warn: "#ff5533",
    bg: "#0e0a04",
    bgCard: "#1a1208",
    bgCardBorder: "#2a1e10",
    accent: "#ffbb55",
    pill: "#ff9922",
    pillBg: "rgba(255,153,34,0.1)",
    scanline: "rgba(255,153,34,0.03)",
    glowSoft: "rgba(255,153,34,0.08)",
  },
};
