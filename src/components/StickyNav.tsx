import { useMemo } from "react";
import { NAV_LINKS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { useActiveSection } from "../hooks/useActiveSection";

export interface StickyNavProps {
  theme: ThemeKey;
  visible: boolean;
  onOpenPalette: () => void;
}

/**
 * Top sticky nav that reveals after the hero. Active section is tracked
 * by IntersectionObserver. A small ⌘K affordance on the right opens the
 * command palette.
 */
export function StickyNav({ theme: _theme, visible, onOpenPalette }: StickyNavProps) {
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
        background: "rgba(0,0,0,0.82)",
        borderBottom: "1px solid var(--c-border)",
        padding: "clamp(10px, 1.5vw + 6px, 12px) clamp(14px, 3vw, 24px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "clamp(11px, 0.4vw + 10px, 13px)",
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.35s var(--ease-out)",
      }}
    >
      <a
        href="#hero"
        aria-label="ransys.dev — back to top"
        style={{
          color: "var(--c-primary)",
          textDecoration: "none",
          fontFamily: "var(--font-display, 'Space Grotesk', system-ui, sans-serif)",
          fontWeight: 700,
          letterSpacing: "0.05em",
          fontSize: "var(--t-sm)",
        }}
      >
        ransys<span style={{ opacity: 0.5 }}>.dev</span>
      </a>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(12px, 3vw, 24px)",
        }}
        className="hide-sm"
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
                color: isActive ? "var(--c-primary)" : "var(--c-dim)",
                fontWeight: isActive ? 600 : 400,
                textDecoration: "none",
                transition: "color 0.18s",
                textShadow: isActive ? "0 0 8px var(--c-glow)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--c-primary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--c-dim)";
              }}
            >
              {link.stickyLabel}
            </a>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Open command palette"
        tabIndex={visible ? 0 : -1}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 10px",
          background: "transparent",
          border: "1px solid var(--c-border)",
          borderRadius: "var(--r-sm)",
          color: "var(--c-dim)",
          fontFamily: "inherit",
          fontSize: "11px",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--c-primary)";
          e.currentTarget.style.borderColor = "var(--c-border-strong)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--c-dim)";
          e.currentTarget.style.borderColor = "var(--c-border)";
        }}
      >
        <span aria-hidden>⌘K</span>
        <span className="hide-sm">search</span>
      </button>
    </nav>
  );
}
