import { motion } from "framer-motion";
import { useState } from "react";
import { SKILLS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { WARN_ACCENT } from "../styles/tokens";
import { Section } from "./Section";

export interface SkillsSectionProps {
  theme: ThemeKey;
}

/**
 * Skill matrix — four glass panels (frontend / backend / tools / learning)
 * with hover-lift micro-interaction and a quiet amber accent on the
 * in-training group so it reads as a current learning ledger.
 */
export function SkillsSection({ theme }: SkillsSectionProps) {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  return (
    <Section
      id="skills"
      theme={theme}
      tag="02"
      title="Stack Map"
      subtitle="The tools currently in rotation, the ones in training."
      contentStyle={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px",
      }}
    >
      {Object.entries(SKILLS).map(([key, group], gi) => {
        const isLearning = key === "learning";
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: gi * 0.08 }}
            className="glass lift"
            style={{
              padding: "24px",
              borderColor: isLearning ? "rgba(255,170,0,0.25)" : undefined,
            }}
          >
            <h3
              style={{
                fontSize: "11px",
                color: isLearning ? WARN_ACCENT : "var(--c-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                margin: "0 0 18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isLearning && (
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    animation: "float 2s ease-in-out infinite",
                  }}
                >
                  ⟳
                </span>
              )}
              {group.label}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {group.items.map((skill) => {
                const isHovered = hoveredSkill === skill;
                return (
                  <div
                    key={skill}
                    onMouseEnter={() => setHoveredSkill(skill)}
                    onMouseLeave={() => setHoveredSkill(null)}
                    style={{
                      fontSize: "var(--t-sm)",
                      color: isHovered ? "var(--c-primary)" : "var(--c-secondary)",
                      padding: "6px 10px",
                      borderRadius: "var(--r-sm)",
                      background: isHovered ? "var(--c-glow-soft)" : "transparent",
                      transition: "all 0.2s ease",
                      cursor: "default",
                      borderLeft: `2px solid ${
                        isHovered ? "var(--c-primary)" : "var(--c-dark-dim)"
                      }`,
                    }}
                  >
                    {skill}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </Section>
  );
}
