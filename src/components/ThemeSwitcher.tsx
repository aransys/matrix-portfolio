import type { ThemeKey } from "../config/themes";

export interface ThemeSwitcherProps {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
}

export function ThemeSwitcher({ theme, setTheme }: ThemeSwitcherProps) {
  const pills: { key: ThemeKey; color: string; label: string }[] = [
    { key: "matrix", color: "#00ff41", label: "Matrix" },
    { key: "reloaded", color: "#4499ff", label: "Reloaded" },
    { key: "revolutions", color: "#ff9922", label: "Revolutions" },
  ];
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
      {pills.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => setTheme(p.key)}
          title={p.label}
          style={{
            width: theme === p.key ? "32px" : "24px",
            height: theme === p.key ? "16px" : "12px",
            borderRadius: "10px",
            background: p.color,
            border: "none",
            cursor: "pointer",
            opacity: theme === p.key ? 1 : 0.4,
            transition: "all 0.3s ease",
            boxShadow: theme === p.key ? `0 0 12px ${p.color}66` : "none",
          }}
        />
      ))}
    </div>
  );
}
