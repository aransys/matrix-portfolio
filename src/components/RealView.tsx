import { useEffect, useRef } from "react";
import { OWNER, PROJECTS, SKILLS, SOCIALS, TIMELINE } from "../config/data";

export interface RealViewProps {
  /** Blue pill — return to the full site. */
  onExit: () => void;
}

/** Channels worth printing on a CV. */
const CV_CONTACTS = ["Email", "GitHub", "LinkedIn"];

/** "https://github.com/x/y/" → "github.com/x/y" — readable on paper. */
function displayUrl(href: string): string {
  return href.replace(/^(https?:\/\/|mailto:)/, "").replace(/\/$/, "");
}

/**
 * The real world — what's left when the simulation is switched off.
 *
 * A plain, fast, printable one-page CV built from the same data as the
 * main site: no canvas, no animation, light background, real links. This
 * is the view to hand a recruiter (`?cv` in the URL opens it directly) and
 * it prints cleanly to a single PDF page.
 */
export function RealView({ onExit }: RealViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus();
  }, []);

  const contacts = SOCIALS.filter((s) => CV_CONTACTS.includes(s.label));

  return (
    <div className="real">
      <div className="real__bar">
        <span className="real__bar-label">
          <span className="real__pill" aria-hidden />
          The real world
        </span>
        <span className="real__bar-actions">
          <button type="button" onClick={() => window.print()}>
            Print / save as PDF
          </button>
          <button type="button" className="real__back" onClick={onExit}>
            <span className="real__pill real__pill--blue" aria-hidden />
            Back to the Matrix
          </button>
        </span>
      </div>

      <main className="real__page">
        <header className="real__header">
          <h1 ref={headingRef} tabIndex={-1}>
            {OWNER.name}
          </h1>
          <p className="real__role">
            {OWNER.role} · {OWNER.location}
          </p>
          <ul className="real__contacts">
            {contacts.map((c) => (
              <li key={c.label}>
                <span className="real__label">{c.label}</span>{" "}
                <a href={c.href}>{displayUrl(c.href)}</a>
              </li>
            ))}
          </ul>
        </header>

        <section aria-labelledby="real-profile">
          <h2 id="real-profile">Profile</h2>
          <p>{OWNER.bio}</p>
        </section>

        <section aria-labelledby="real-projects">
          <h2 id="real-projects">Projects</h2>
          {PROJECTS.map((p) => (
            <article key={p.codename} className="real__item">
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <p className="real__meta">{p.tech.join(" · ")}</p>
              <p className="real__meta">
                {p.live && (
                  <>
                    <span className="real__label">Live</span>{" "}
                    <a href={p.live}>{displayUrl(p.live)}</a>
                    {"  "}
                  </>
                )}
                <span className="real__label">Source</span>{" "}
                <a href={p.github}>{displayUrl(p.github)}</a>
              </p>
            </article>
          ))}
        </section>

        <section aria-labelledby="real-skills">
          <h2 id="real-skills">Skills</h2>
          <dl className="real__skills">
            {Object.values(SKILLS).map((group) => (
              <div key={group.label}>
                <dt>{group.label === "In Training" ? "Currently learning" : group.label}</dt>
                <dd>{group.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="real-background">
          <h2 id="real-background">Education &amp; background</h2>
          {TIMELINE.map((t) => (
            <article key={t.title} className="real__item real__item--dated">
              <span className="real__period">{t.period}</span>
              <div>
                <h3>
                  {t.title} <span className="real__place">— {t.place}</span>
                </h3>
                <p>{t.detail}</p>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
