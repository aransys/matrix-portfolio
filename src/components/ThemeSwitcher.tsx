import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface ThemeSwitcherProps {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
}

export function ThemeSwitcher({ theme, setTheme }: ThemeSwitcherProps) {
  const keys = Object.keys(THEMES) as ThemeKey[];
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 100,
        display: "flex",
        gap: "8px",
        background: "rgba(0,0,0,0.7)",
        padding: "8px 12px",
        borderRadius: "24px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {keys.map((key) => {
        const color = THEMES[key].primary;
        const active = theme === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            title={THEMES[key].name}
            aria-label={`Switch to ${THEMES[key].name} theme`}
            aria-pressed={active}
            style={{
              width: active ? "32px" : "24px",
              height: active ? "16px" : "12px",
              borderRadius: "10px",
              background: color,
              border: "none",
              cursor: "pointer",
              opacity: active ? 1 : 0.4,
              transition: "all 0.3s ease",
              boxShadow: active ? `0 0 12px ${color}66` : "none",
            }}
          />
        );
      })}
    </div>
  );
}
