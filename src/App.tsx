import { useEffect, useState } from "react";
import { AboutSection } from "./components/AboutSection";
import { ContactSection } from "./components/ContactSection";
import EasterEggs from "./components/EasterEggs";
import { MatrixRain2D } from "./components/MatrixRain2D";
import { ProjectsSection } from "./components/ProjectsSection";
import { SkillsSection } from "./components/SkillsSection";
import { StickyNav } from "./components/StickyNav";
import { TerminalHero } from "./components/TerminalHero";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { TimelineSection } from "./components/TimelineSection";
import type { ThemeKey } from "./config/themes";
import { THEMES } from "./config/themes";
import { useScrollPosition } from "./hooks/useScrollPosition";

export default function App() {
  const [theme, setTheme] = useState<ThemeKey>("matrix");
  const showNav = useScrollPosition();
  const t = THEMES[theme];

  useEffect(() => {
    const th = THEMES[theme];
    document.body.style.background = th.bg;
    document.documentElement.style.setProperty("--theme-bg", th.bg);
    document.documentElement.style.setProperty("--theme-primary", th.primary);
    document.documentElement.style.setProperty("--theme-dark-dim", th.darkDim);
  }, [theme]);

  return (
    <div
      style={{
        background: t.bg,
        minHeight: "100vh",
        transition: "background 0.5s ease",
      }}
    >
      <EasterEggs theme={theme} setTheme={setTheme} />
      <MatrixRain2D theme={theme} />
      <ThemeSwitcher theme={theme} setTheme={setTheme} />
      <StickyNav theme={theme} visible={showNav} />
      <TerminalHero theme={theme} />
      <AboutSection theme={theme} />
      <SkillsSection theme={theme} />
      <ProjectsSection theme={theme} />
      <TimelineSection theme={theme} />
      <ContactSection theme={theme} />
    </div>
  );
}
