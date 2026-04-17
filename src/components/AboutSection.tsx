import { motion } from "framer-motion";
import { OWNER } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { SectionHeader } from "./SectionHeader";

export interface AboutSectionProps {
  theme: ThemeKey;
}

export function AboutSection({ theme }: AboutSectionProps) {
  const t = THEMES[theme];
  return (
    <section
      id="about"
      style={{
        padding: "100px 20px",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <SectionHeader theme={theme} tag="// 01" title="About" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        style={{
          background: "rgba(0,0,0,0.75)",
          border: `1px solid ${t.darkDim}`,
          borderRadius: "8px",
          padding: "32px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                color: t.dim,
                textTransform: "uppercase",
                letterSpacing: "3px",
                marginBottom: "4px",
              }}
            >
              CLASSIFIED DOSSIER
            </div>
            <h3
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: t.primary,
                margin: 0,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {OWNER.name}
            </h3>
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: t.bg,
              background: t.primary,
              padding: "3px 10px",
              borderRadius: "3px",
              fontWeight: 700,
            }}
          >
            ACTIVE
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "13px",
          }}
        >
          {OWNER.dossierFields.map((item) => (
            <div key={item.label}>
              <div
                style={{
                  color: t.dim,
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  marginBottom: "4px",
                }}
              >
                {item.label}
              </div>
              <div style={{ color: t.secondary }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "24px",
            borderTop: `1px solid ${t.darkDim}`,
            paddingTop: "20px",
          }}
        >
          <p
            style={{
              color: t.dim,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "13px",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            {OWNER.bio}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
