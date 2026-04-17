import { MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";
import { AboutSection } from "./components/AboutSection";
import { ContactSection } from "./components/ContactSection";
import { EasterEggs } from "./components/EasterEggs";
import { MatrixRain2D } from "./components/MatrixRain2D";
import { ProjectsSection } from "./components/ProjectsSection";
import { ScrollProgress } from "./components/ScrollProgress";
import { SkillsSection } from "./components/SkillsSection";
import { StickyNav } from "./components/StickyNav";
import { TerminalHero } from "./components/TerminalHero";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { TimelineSection } from "./components/TimelineSection";
import type { ThemeKey } from "./config/themes";
import { THEMES } from "./config/themes";
import { useScrolledPastHero } from "./hooks/useScrolledPastHero";

export default function App() {
  const [theme, setTheme] = useState<ThemeKey>("matrix");
  const showNav = useScrolledPastHero();

  // Sync theme → CSS custom properties. `body` reads these via global.css, so
  // the background + text colour transition without each component having to
  // set them individually.
  useEffect(() => {
    const { bg, primary, darkDim } = THEMES[theme];
    const root = document.documentElement.style;
    root.setProperty("--theme-bg", bg);
    root.setProperty("--theme-primary", primary);
    root.setProperty("--theme-dark-dim", darkDim);
  }, [theme]);

  return (
    // `reducedMotion="user"` makes Framer Motion honour the OS-level
    // prefers-reduced-motion setting, so every scroll-reveal snaps instead of
    // sliding for users who opted out of motion.
    <MotionConfig reducedMotion="user">
      <div style={{ minHeight: "100vh" }}>
        <a className="skip-link" href="#about">
          Skip to content
        </a>
        <EasterEggs theme={theme} setTheme={setTheme} />
        <MatrixRain2D theme={theme} />
        <ScrollProgress theme={theme} />
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
        <StickyNav theme={theme} visible={showNav} />
        <TerminalHero theme={theme} />
        <AboutSection theme={theme} />
        <SkillsSection theme={theme} />
        <ProjectsSection theme={theme} />
        <TimelineSection theme={theme} />
        <ContactSection theme={theme} />
      </div>
    </MotionConfig>
  );
}
