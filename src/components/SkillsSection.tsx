import { motion } from "framer-motion";
import { useState } from "react";
import { SKILLS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { SectionHeader } from "./SectionHeader";

export interface SkillsSectionProps {
  theme: ThemeKey;
}

export function SkillsSection({ theme }: SkillsSectionProps) {
  const t = THEMES[theme];
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  return (
    <section
      id="skills"
      style={{
        padding: "100px 20px",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <SectionHeader theme={theme} tag="// 02" title="Tech Matrix" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        {Object.entries(SKILLS).map(([key, group]) => (
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
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: key === "learning" ? t.warn : t.primary,
                textTransform: "uppercase",
                letterSpacing: "3px",
                marginBottom: "16px",
                margin: "0 0 16px",
              }}
            >
              {key === "learning" ? `⟳ ${group.label}` : group.label}
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {group.items.map((skill) => (
                <div
                  key={skill}
                  onMouseEnter={() => setHoveredSkill(skill)}
                  onMouseLeave={() => setHoveredSkill(null)}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "13px",
                    color: hoveredSkill === skill ? t.primary : t.secondary,
                    padding: "6px 10px",
                    borderRadius: "4px",
                    background:
                      hoveredSkill === skill ? t.glowSoft : "transparent",
                    transition: "all 0.2s ease",
                    cursor: "default",
                    borderLeft: `2px solid ${hoveredSkill === skill ? t.primary : t.darkDim}`,
                  }}
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
