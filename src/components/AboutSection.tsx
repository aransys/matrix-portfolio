import { motion } from "framer-motion";
import { OWNER } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { Section } from "./Section";

export interface AboutSectionProps {
  theme: ThemeKey;
}

/**
 * Operator dossier — the "who is this" section. Now laid out as a glass
 * dossier panel with bio prose to the side, dossier fields in a grid.
 */
export function AboutSection({ theme }: AboutSectionProps) {
  return (
    <Section
      id="about"
      theme={theme}
      tag="01"
      title="The Operator"
      subtitle="A short dossier on the person behind the keyboard."
    >
      <div
        className="glass glass--raised"
        style={{
          padding: "clamp(24px, 3vw + 12px, 40px)",
          position: "relative",
        }}
      >
        <span className="scanline" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <div className="tag" style={{ marginBottom: "6px" }}>
              Classified Dossier
            </div>
            <h3
              className="font-display"
              style={{
                fontSize: "clamp(22px, 2.5vw + 10px, 32px)",
                fontWeight: 700,
                color: "var(--c-primary)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {OWNER.name}
            </h3>
          </div>
          <span
            style={{
              fontSize: "10px",
              color: "var(--c-bg)",
              background: "var(--c-primary)",
              padding: "4px 12px",
              borderRadius: "var(--r-sm)",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            ACTIVE
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          {OWNER.dossierFields.map((field, i) => (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <div className="tag" style={{ marginBottom: "6px" }}>
                {field.label}
              </div>
              <div
                style={{
                  color: "var(--c-secondary)",
                  fontSize: "var(--t-base)",
                }}
              >
                {field.value}
              </div>
            </motion.div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--c-border)",
            paddingTop: "24px",
          }}
        >
          <p
            style={{
              color: "var(--c-dim)",
              fontSize: "var(--t-base)",
              lineHeight: 1.8,
              margin: 0,
              maxWidth: "65ch",
            }}
          >
            {OWNER.bio}
          </p>
        </div>
      </div>
    </Section>
  );
}
