import { useState } from "react";
import type { ThemeKey } from "../config/themes";
import { THEMES, THEME_ORDER } from "../config/themes";

export interface ThemeSwitcherProps {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  /** True while no theme is locked and the colour follows the scroll. */
  auto: boolean;
  /** Unlock: go back to following the scroll. */
  onAuto: () => void;
  /**
   * True while the sticky nav is showing: the switcher tucks into the
   * nav bar's right edge and only shows its tagline on hover.
   */
  docked?: boolean;
}

/**
 * Top-right theme swatch row. Each pill is the theme's primary colour;
 * the active one is bolder and exposes a tooltip with the film tagline.
 * The first, three-coloured swatch is "auto": the theme follows the
 * scroll. Picking a colour locks it; picking auto unlocks it again.
 * Switching is animated — the CSS variables fade everywhere at once.
 */
export function ThemeSwitcher({
  theme,
  setTheme,
  auto,
  onAuto,
  docked = false,
}: ThemeSwitcherProps) {
  const [hovered, setHovered] = useState<ThemeKey | "auto" | null>(null);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      style={{
        position: "fixed",
        top: docked ? "8px" : "clamp(12px, 2vw, 20px)",
        transition: "top 0.35s var(--ease-out)",
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
          padding: docked ? "7px 12px" : "8px 12px",
          borderRadius: "var(--r-pill)",
          backdropFilter: "blur(12px) saturate(140%)",
          WebkitBackdropFilter: "blur(12px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 12px 32px -10px rgba(0,0,0,0.6)",
        }}
      >
        <button
          type="button"
          role="radio"
          aria-checked={auto}
          aria-label="Automatic — the colour follows the scroll"
          onClick={onAuto}
          onMouseEnter={() => setHovered("auto")}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: auto ? "32px" : "20px",
            height: "14px",
            borderRadius: "var(--r-pill)",
            background: `linear-gradient(90deg, ${THEME_ORDER.map((k) => THEMES[k].primary).join(", ")})`,
            border: "none",
            cursor: "pointer",
            opacity: auto ? 1 : 0.4,
            transition: "all 0.3s var(--ease-out)",
            boxShadow: auto ? "0 0 14px rgba(255,255,255,0.35)" : "none",
            transform: hovered === "auto" && !auto ? "scale(1.15)" : "scale(1)",
          }}
        />
        {THEME_ORDER.map((key) => {
          const t = THEMES[key];
          // In auto the current colour is shown as a quieter second marker.
          const isActive = !auto && theme === key;
          const isCurrent = auto && theme === key;
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
                opacity: isActive ? 1 : isCurrent ? 0.8 : 0.4,
                transition: "all 0.3s var(--ease-out)",
                boxShadow: isActive ? `0 0 14px ${t.primary}88` : "none",
                transform: isHovered && !isActive ? "scale(1.15)" : "scale(1)",
              }}
            />
          );
        })}
      </div>
      {(hovered || !docked) && (
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
          {hovered === "auto"
            ? "auto · follows the scroll"
            : hovered
              ? THEMES[hovered].tagline
              : auto
                ? `auto · ${THEMES[theme].tagline}`
                : THEMES[theme].tagline}
        </div>
      )}
    </div>
  );
}
