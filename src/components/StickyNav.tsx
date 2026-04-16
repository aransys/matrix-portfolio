import { NAV_LINKS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface StickyNavProps {
  theme: ThemeKey;
  visible: boolean;
}

export function StickyNav({ theme, visible }: StickyNavProps) {
  const t = THEMES[theme];
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.85)",
        borderBottom: `1px solid ${t.darkDim}`,
        padding: "12px 24px",
        display: "flex",
        justifyContent: "center",
        gap: "24px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        backdropFilter: "blur(12px)",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.3s ease",
      }}
    >
      {NAV_LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          style={{
            color: t.dim,
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLAnchorElement).style.color = t.primary;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLAnchorElement).style.color = t.dim;
          }}
        >
          {l.stickyLabel}
        </a>
      ))}
    </nav>
  );
}
