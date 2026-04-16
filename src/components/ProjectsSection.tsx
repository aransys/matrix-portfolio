import { motion } from "framer-motion";
import { PROJECTS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { SectionHeader } from "./SectionHeader";

export interface ProjectsSectionProps {
  theme: ThemeKey;
}

export function ProjectsSection({ theme }: ProjectsSectionProps) {
  const t = THEMES[theme];
  return (
    <section
      id="projects"
      style={{
        padding: "100px 20px",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <SectionHeader theme={theme} tag="// 03" title="Missions" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        style={{ display: "flex", flexDirection: "column", gap: "24px" }}
      >
        {PROJECTS.map((p, i) => (
          <div
            key={p.codename}
            style={{
              background: "rgba(0,0,0,0.75)",
              border: `1px solid ${t.darkDim}`,
              borderRadius: "8px",
              padding: "28px 32px",
              backdropFilter: "blur(8px)",
              transition: "border-color 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = t.dim;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = t.darkDim;
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    color: t.dim,
                    letterSpacing: "3px",
                  }}
                >
                  MISSION_{String(i + 1).padStart(2, "0")} //
                  {p.codename}
                </span>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: t.primary,
                    margin: "4px 0 0",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {p.title}
                </h3>
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "#28c940",
                  background: "rgba(40,201,64,0.1)",
                  padding: "3px 10px",
                  borderRadius: "3px",
                  border: "1px solid rgba(40,201,64,0.2)",
                }}
              >
                {p.status}
              </span>
            </div>

            <p
              style={{
                color: t.dim,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "13px",
                lineHeight: 1.7,
                margin: "0 0 16px",
              }}
            >
              {p.desc}
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "16px",
              }}
            >
              {p.tech.map((tech) => (
                <span
                  key={tech}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: t.secondary,
                    background: t.pillBg,
                    padding: "3px 10px",
                    borderRadius: "4px",
                    border: `1px solid ${t.darkDim}`,
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <a
                href={p.live}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  color: t.primary,
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLAnchorElement).style.opacity = "0.7";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLAnchorElement).style.opacity = "1";
                }}
              >
                ▸ Live Demo
              </a>
              <a
                href={p.github}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
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
                ◇ Source Code
              </a>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
