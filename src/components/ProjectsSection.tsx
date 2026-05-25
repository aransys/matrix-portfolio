import { motion } from "framer-motion";
import { PROJECTS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { Section } from "./Section";

export interface ProjectsSectionProps {
  theme: ThemeKey;
}

/**
 * Mission archive — projects rendered as cinematic glass cards with
 * codename headers and tech pills. Each card animates in independently
 * as it enters the viewport.
 */
export function ProjectsSection({ theme }: ProjectsSectionProps) {
  return (
    <Section
      id="projects"
      theme={theme}
      tag="03"
      title="Mission Log"
      subtitle="Shipped work — see each in production or browse the source."
      contentStyle={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {PROJECTS.map((project, i) => (
        <motion.article
          key={project.codename}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
          className="glass lift glass--interactive"
          style={{
            padding: "clamp(22px, 3vw + 8px, 32px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, var(--c-primary), transparent)",
              opacity: 0.4,
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--c-dim)",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                MISSION_{String(i + 1).padStart(2, "0")} // {project.codename}
              </span>
              <h3
                className="font-display"
                style={{
                  fontSize: "clamp(18px, 2vw + 6px, 24px)",
                  fontWeight: 700,
                  color: "var(--c-primary)",
                  margin: "4px 0 0",
                  letterSpacing: "-0.01em",
                }}
              >
                {project.title}
              </h3>
            </div>
            <span
              style={{
                fontSize: "10px",
                // Theme-coloured status chip. Uses CSS variables so swapping
                // themes repaints it in a single browser tick — no React
                // re-render needed.
                color: "var(--c-primary)",
                background: "var(--c-pill-bg)",
                padding: "4px 12px",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--c-border-strong)",
                letterSpacing: "0.1em",
                fontWeight: 600,
                textShadow: "0 0 8px var(--c-glow-soft)",
              }}
            >
              {project.status}
            </span>
          </div>

          <p
            style={{
              color: "var(--c-dim)",
              fontSize: "var(--t-base)",
              lineHeight: 1.75,
              margin: "0 0 18px",
            }}
          >
            {project.desc}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginBottom: "20px",
            }}
          >
            {project.tech.map((tech) => (
              <span
                key={tech}
                style={{
                  fontSize: "11px",
                  color: "var(--c-secondary)",
                  background: "var(--c-pill-bg)",
                  padding: "4px 12px",
                  borderRadius: "var(--r-pill)",
                  border: "1px solid var(--c-border)",
                }}
              >
                {tech}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title} — live demo`}
              style={{
                fontSize: "var(--t-sm)",
                color: "var(--c-primary)",
                textDecoration: "none",
                transition: "opacity 0.15s",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              ▸ Live demo
            </a>
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title} — source code on GitHub`}
              style={{
                fontSize: "var(--t-sm)",
                color: "var(--c-dim)",
                textDecoration: "none",
                transition: "color 0.15s",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--c-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--c-dim)";
              }}
            >
              ◇ Source code
            </a>
          </div>
        </motion.article>
      ))}
    </Section>
  );
}
