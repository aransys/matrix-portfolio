import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface ThemeSwitcherProps {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
}

/** Render order follows the insertion order of THEMES — chronological film
 *  trilogy by default. Adding a new theme to themes.ts is enough. */
const THEME_ORDER = Object.keys(THEMES) as ThemeKey[];

export function ThemeSwitcher({ theme, setTheme }: ThemeSwitcherProps) {
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
        gap: "clamp(6px, 1vw + 2px, 8px)",
        background: "rgba(0,0,0,0.7)",
        padding: "clamp(6px, 1vw + 3px, 8px) clamp(10px, 1.5vw + 5px, 12px)",
        borderRadius: "24px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {THEME_ORDER.map((key) => {
        const { name, primary } = THEMES[key];
        const isActive = theme === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`Switch to ${name} theme`}
            onClick={() => setTheme(key)}
            style={{
              width: isActive ? "32px" : "24px",
              height: isActive ? "16px" : "12px",
              borderRadius: "10px",
              background: primary,
              border: "none",
              cursor: "pointer",
              opacity: isActive ? 1 : 0.4,
              transition: "all 0.3s ease",
              boxShadow: isActive ? `0 0 12px ${primary}66` : "none",
            }}
          />
        );
      })}
    </div>
  );
}
