import { useState } from "react";
import type { ThemeKey } from "../config/themes";
import { THEMES, THEME_ORDER } from "../config/themes";

export interface ThemeSwitcherProps {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
}

/**
 * Top-right theme swatch row. Each pill is the theme's primary colour;
 * the active one is bolder and exposes a tooltip with the film tagline.
 * Switching is animated — the CSS variables fade everywhere at once.
 */
export function ThemeSwitcher({ theme, setTheme }: ThemeSwitcherProps) {
  const [hovered, setHovered] = useState<ThemeKey | null>(null);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      style={{
        position: "fixed",
        top: "clamp(12px, 2vw, 20px)",
        right: "clamp(12px, 2vw, 20px)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "6px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "clamp(6px, 1vw + 2px, 8px)",
          background: "rgba(0,0,0,0.62)",
          padding: "8px 12px",
          borderRadius: "var(--r-pill)",
          backdropFilter: "blur(12px) saturate(140%)",
          WebkitBackdropFilter: "blur(12px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 12px 32px -10px rgba(0,0,0,0.6)",
        }}
      >
        {THEME_ORDER.map((key) => {
          const t = THEMES[key];
          const isActive = theme === key;
          const isHovered = hovered === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`Switch to ${t.name} theme — ${t.tagline}`}
              onClick={() => setTheme(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: isActive ? "32px" : "20px",
                height: "14px",
                borderRadius: "var(--r-pill)",
                background: t.primary,
                border: "none",
                cursor: "pointer",
                opacity: isActive ? 1 : 0.4,
                transition: "all 0.3s var(--ease-out)",
                boxShadow: isActive ? `0 0 14px ${t.primary}88` : "none",
                transform: isHovered && !isActive ? "scale(1.15)" : "scale(1)",
              }}
            />
          );
        })}
      </div>
      {(hovered || theme) && (
        <div
          aria-hidden
          style={{
            fontSize: "10px",
            color: "var(--c-dim)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "4px 10px",
            background: "rgba(0,0,0,0.45)",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--c-border)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {THEMES[hovered ?? theme].tagline}
        </div>
      )}
    </div>
  );
}
