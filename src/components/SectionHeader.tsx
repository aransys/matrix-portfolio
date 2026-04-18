import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface SectionHeaderProps {
  theme: ThemeKey;
  /** Prefix label, e.g. "// 01" */
  tag: string;
  title: string;
}

export function SectionHeader({ theme, tag, title }: SectionHeaderProps) {
  const t = THEMES[theme];
  return (
    <header style={{ marginBottom: "clamp(28px, 5vw, 40px)" }}>
      <span
        style={{
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
          letterSpacing: "1px",
        }}
      >
        {title}
      </h2>
      <div
        aria-hidden
        style={{
          width: "60px",
          height: "2px",
          background: t.primary,
          marginTop: "12px",
          opacity: 0.6,
        }}
      />
    </header>
  );
}
