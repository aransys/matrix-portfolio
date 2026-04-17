import { useMemo } from "react";
import { NAV_LINKS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { useActiveSection } from "../hooks/useActiveSection";

export interface StickyNavProps {
  theme: ThemeKey;
  visible: boolean;
}

export function StickyNav({ theme, visible }: StickyNavProps) {
  const t = THEMES[theme];

  // NAV_LINKS hrefs are "#about" etc — strip the "#" to get raw section ids
  // that IntersectionObserver can resolve via document.getElementById.
  const sectionIds = useMemo(
    () => NAV_LINKS.map((l) => l.href.replace(/^#/, "")),
    [],
  );
  const activeId = useActiveSection(sectionIds);

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
      {NAV_LINKS.map((link) => {
        const id = link.href.replace(/^#/, "");
        const isActive = id === activeId;
        return (
          <a
            key={link.href}
            href={link.href}
            tabIndex={visible ? 0 : -1}
            aria-current={isActive ? "location" : undefined}
            style={{
              color: isActive ? t.primary : t.dim,
              fontWeight: isActive ? 600 : 400,
              textDecoration: "none",
              transition: "color 0.15s",
              // Reserve the space a 600-weight glyph would take so the bar
              // doesn't reflow when the active link changes.
              textShadow: isActive ? `0 0 8px ${t.primary}55` : "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = t.primary;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = t.dim;
            }}
          >
            {link.stickyLabel}
          </a>
        );
      })}
    </nav>
  );
}
