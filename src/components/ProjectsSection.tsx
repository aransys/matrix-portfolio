import { PROJECTS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { cardStyle } from "../styles/tokens";
import { Section } from "./Section";

export interface ProjectsSectionProps {
  theme: ThemeKey;
}

/** Colour for the "DEPLOYED" pill — deliberately theme-independent so status
 *  stays recognisable across all three palettes. */
const STATUS_GREEN = "#28c940";

export function ProjectsSection({ theme }: ProjectsSectionProps) {
  const t = THEMES[theme];

  return (
    <Section
      id="projects"
      theme={theme}
      tag="// 03"
      title="Missions"
      contentStyle={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {PROJECTS.map((project, i) => (
        <article
          key={project.codename}
          style={{
            ...cardStyle(t, { padding: "28px 32px" }),
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
                  fontSize: "10px",
                  color: t.dim,
                  letterSpacing: "3px",
                }}
              >
                MISSION_{String(i + 1).padStart(2, "0")} // {project.codename}
              </span>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: t.primary,
                  margin: "4px 0 0",
                }}
              >
                {project.title}
              </h3>
            </div>
            <span
              style={{
                fontSize: "10px",
                color: STATUS_GREEN,
                background: "rgba(40,201,64,0.1)",
                padding: "3px 10px",
                borderRadius: "3px",
                border: "1px solid rgba(40,201,64,0.2)",
              }}
            >
              {project.status}
            </span>
          </div>

          <p
            style={{
              color: t.dim,
              fontSize: "13px",
              lineHeight: 1.7,
              margin: "0 0 16px",
            }}
          >
            {project.desc}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginBottom: "16px",
            }}
          >
            {project.tech.map((tech) => (
              <span
                key={tech}
                style={{
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
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title} — live demo`}
              style={{
                fontSize: "12px",
                color: t.primary,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              ▸ Live Demo
            </a>
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title} — source code on GitHub`}
              style={{
                fontSize: "12px",
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
              ◇ Source Code
            </a>
          </div>
        </article>
      ))}
    </Section>
  );
}
