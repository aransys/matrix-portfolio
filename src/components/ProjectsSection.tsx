import { motion } from "framer-motion";
import { useState } from "react";
import { PROJECTS } from "../config/data";
import type { Project } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { Section } from "./Section";

export interface ProjectsSectionProps {
  theme: ThemeKey;
}

/**
 * Mission archive — each project is a case file: a CRT monitor showing the
 * project on one side, the briefing on the other. Sides alternate down the
 * page. Monitors show a phosphor-tinted feed that clears to full colour on
 * hover or focus (touch devices get full colour straight away).
 */
export function ProjectsSection({ theme }: ProjectsSectionProps) {
  return (
    <Section
      id="projects"
      theme={theme}
      tag="03"
      title="Mission Log"
      subtitle="Shipped work — see each in production or browse the source."
      contentStyle={{ display: "flex", flexDirection: "column", gap: "28px" }}
    >
      {PROJECTS.map((project, i) => (
        <motion.article
          key={project.codename}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className={`glass mission${i % 2 === 1 ? " mission--flip" : ""}`}
        >
          <MissionScreen project={project} />

          <div className="mission__brief">
            <div className="mission__meta">
              <span className="tag">
                MISSION_{project.id} // {project.codename}
              </span>
              <span className="mission__status">{project.status}</span>
            </div>

            <h3 className="font-display mission__title">{project.title}</h3>
            <p className="mission__desc">{project.desc}</p>

            <ul className="mission__tech" aria-label="Built with">
              {project.tech.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>

            <div className="mission__links">
              {project.live && (
                <a
                  href={project.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${project.title} — live demo`}
                  className="mission__link mission__link--primary"
                >
                  ▸ Live demo
                </a>
              )}
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} — source code on GitHub`}
                className="mission__link"
              >
                ◇ Source code
              </a>
            </div>
          </div>
        </motion.article>
      ))}
    </Section>
  );
}

/**
 * The monitor. Links to the live project when there is one. Falls back to
 * a "no visual feed" card when the project has no screenshot or the file
 * fails to load.
 */
function MissionScreen({ project }: { project: Project }) {
  const [failed, setFailed] = useState(false);
  const hasImage = project.image !== undefined && !failed;

  const feed = hasImage ? (
    <img
      src={project.image}
      alt={`Screenshot of ${project.title}`}
      width={1600}
      height={1000}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="crt__nofeed">
      <span>NO VISUAL FEED</span>
      <span className="crt__nofeed-code">{project.codename}</span>
    </span>
  );

  if (!project.live) {
    return <div className="crt mission__screen">{feed}</div>;
  }
  return (
    <a
      href={project.live}
      target="_blank"
      rel="noopener noreferrer"
      className="crt mission__screen"
      aria-label={`Open ${project.title} live`}
      // The text link beside it does the same job for keyboard users.
      tabIndex={-1}
    >
      {feed}
      <span className="crt__cta" aria-hidden>
        ▸ jack in
      </span>
    </a>
  );
}
