import { useState } from "react";
import { SKILLS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { Section } from "./Section";

export interface SkillsSectionProps {
  theme: ThemeKey;
}

const LEARNING_ACCENT = "#ffaa00";

export function SkillsSection({ theme }: SkillsSectionProps) {
  const t = THEMES[theme];
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  return (
    <Section
      id="skills"
      theme={theme}
      tag="// 02"
      title="Tech Matrix"
      contentStyle={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
      }}
    >
      {Object.entries(SKILLS).map(([key, group]) => {
        const isLearning = key === "learning";
        return (
          <div
            key={key}
            style={{
              background: "rgba(0,0,0,0.75)",
              border: `1px solid ${t.darkDim}`,
              borderRadius: "8px",
              padding: "24px",
              backdropFilter: "blur(8px)",
            }}
          >
            <h3
              style={{
                fontSize: "11px",
                color: isLearning ? LEARNING_ACCENT : t.primary,
                textTransform: "uppercase",
                letterSpacing: "3px",
                margin: "0 0 16px",
              }}
            >
              {isLearning ? `⟳ ${group.label}` : group.label}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {group.items.map((skill) => {
                const isHovered = hoveredSkill === skill;
                return (
                  <div
                    key={skill}
                    onMouseEnter={() => setHoveredSkill(skill)}
                    onMouseLeave={() => setHoveredSkill(null)}
                    style={{
                      fontSize: "13px",
                      color: isHovered ? t.primary : t.secondary,
                      padding: "6px 10px",
                      borderRadius: "4px",
                      background: isHovered ? t.glowSoft : "transparent",
                      transition: "all 0.2s ease",
                      cursor: "default",
                      borderLeft: `2px solid ${
                        isHovered ? t.primary : t.darkDim
                      }`,
                    }}
                  >
                    {skill}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </Section>
  );
}
