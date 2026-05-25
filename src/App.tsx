import { MotionConfig } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { AboutSection } from "./components/AboutSection";
import { CommandPalette } from "./components/CommandPalette";
import type { EggKey } from "./config/commands";
import { ContactSection } from "./components/ContactSection";
import { EasterEggs } from "./components/EasterEggs";
import { MatrixRain } from "./components/MatrixRain";
import { ProjectsSection } from "./components/ProjectsSection";
import { ScrollProgress } from "./components/ScrollProgress";
import { SkillsSection } from "./components/SkillsSection";
import { StickyNav } from "./components/StickyNav";
import { TerminalHero } from "./components/TerminalHero";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { TimelineSection } from "./components/TimelineSection";
import type { ThemeKey } from "./config/themes";
import { THEMES, themeToCssVars } from "./config/themes";
import { useScrolledPastHero } from "./hooks/useScrolledPastHero";

const THEME_STORAGE_KEY = "ransys.dev:theme";

/** Read persisted theme; default to "matrix". */
function readInitialTheme(): ThemeKey {
  if (typeof window === "undefined") return "matrix";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "matrix" || stored === "reloaded" || stored === "revolutions") {
      return stored;
    }
  } catch {
    // ignore storage errors (privacy mode, etc.)
  }
  return "matrix";
}

/**
 * App composition root.
 *
 * Responsibilities:
 *   - Owns the active theme; mirrors it into CSS variables on :root so the
 *     entire DOM repaints in a single tick rather than re-rendering every
 *     themed component.
 *   - Persists the user's theme choice across visits.
 *   - Listens for the global Cmd+K to open the command palette.
 *   - Bridges the palette to the easter-egg orchestrator via the
 *     `window.__matrixEggs` action surface.
 */
export default function App() {
  const [theme, setTheme] = useState<ThemeKey>(readInitialTheme);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const showNav = useScrolledPastHero();

  // Sync theme → CSS custom properties on :root. Components read these via
  // global.css, so the visual transition happens in a single browser paint
  // instead of dozens of React re-renders.
  useEffect(() => {
    const themeObj = THEMES[theme];
    const vars = themeToCssVars(themeObj);
    const root = document.documentElement.style;
    for (const [key, value] of Object.entries(vars)) {
      root.setProperty(key, value);
    }
    // Update theme-color meta for browser chrome on iOS / Android
    const meta = document.querySelector<HTMLMetaElement>("meta[name=theme-color]");
    if (meta) meta.content = themeObj.bg;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Global Cmd/Ctrl + K to open palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (e.key === "/" && !mod) {
        // "/" also opens the palette — common shortcut in modern apps.
        const target = e.target as HTMLElement | null;
        const isEditable =
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable;
        if (!isEditable) {
          e.preventDefault();
          setPaletteOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Command palette's context — most of the action surface lives in the
  // EasterEggs component, exposed via window.__matrixEggs. We read it
  // lazily so it's always fresh.
  const ctx = useCallback(() => {
    type EggBridge = {
      triggerEgg: (k: EggKey) => void;
      toggleEgg: (k: EggKey) => void;
      showMessage: (m: string, ms?: number) => void;
    };
    const eggs = (window as unknown as { __matrixEggs?: EggBridge }).__matrixEggs;
    return {
      setTheme: (k: ThemeKey) => setTheme(k),
      triggerEgg: (k: EggKey) => eggs?.triggerEgg(k),
      toggleEgg: (k: EggKey) => eggs?.toggleEgg(k),
      showMessage: (m: string, ms?: number) => eggs?.showMessage(m, ms),
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#about">
        Skip to content
      </a>

      <MatrixRain theme={theme} density={0.62} intensity={0.85} />
      <ScrollProgress theme={theme} />
      <ThemeSwitcher theme={theme} setTheme={setTheme} />
      <StickyNav
        theme={theme}
        visible={showNav}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <main style={{ position: "relative", zIndex: 1 }}>
        <TerminalHero
          theme={theme}
          setTheme={setTheme}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <AboutSection theme={theme} />
        <SkillsSection theme={theme} />
        <ProjectsSection theme={theme} />
        <TimelineSection theme={theme} />
        <ContactSection theme={theme} />
      </main>

      <EasterEggs theme={theme} setTheme={setTheme} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        ctx={ctx()}
      />
    </MotionConfig>
  );
}
