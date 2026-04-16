import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface SectionHeaderProps {
  theme: ThemeKey;
  tag: string;
  title: string;
}

export function SectionHeader({ theme, tag, title }: SectionHeaderProps) {
  const t = THEMES[theme];
  return (
    <div style={{ marginBottom: "40px" }}>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          color: t.dim,
          textTransform: "uppercase",
          letterSpacing: "3px",
        }}
      >
        {tag}
      </span>
      <h2
        style={{
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 700,
          color: t.primary,
          margin: "8px 0 0",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "1px",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          width: "60px",
          height: "2px",
          background: t.primary,
          marginTop: "12px",
          opacity: 0.6,
        }}
      />
    </div>
  );
}
