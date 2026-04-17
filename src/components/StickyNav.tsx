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
      aria-label="Primary"
      aria-hidden={!visible}
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
        fontSize: "12px",
        backdropFilter: "blur(12px)",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.3s ease",
      }}
    >
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          tabIndex={visible ? 0 : -1}
          style={{
            color: t.dim,
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = t.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = t.dim;
          }}
        >
          {link.stickyLabel}
        </a>
      ))}
    </nav>
  );
}
