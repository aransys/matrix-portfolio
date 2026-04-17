import { motion } from "framer-motion";
import { SOCIALS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { SectionHeader } from "./SectionHeader";

export interface ContactSectionProps {
  theme: ThemeKey;
}

export function ContactSection({ theme }: ContactSectionProps) {
  const t = THEMES[theme];

  return (
    <section
      id="contact"
      style={{
        padding: "100px 20px 80px",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <SectionHeader theme={theme} tag="// 05" title="Transmission" />
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
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "14px",
            color: t.secondary,
            lineHeight: 1.8,
            margin: "0 0 28px",
          }}
        >
          Open to internships, freelance projects, and collaboration.
          <br />
          Send a signal — I'll respond from the construct.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 18px",
                background: t.glowSoft,
                border: `1px solid ${t.darkDim}`,
                borderRadius: "6px",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = t.dim;
                e.currentTarget.style.background = t.pillBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = t.darkDim;
                e.currentTarget.style.background = t.glowSoft;
              }}
            >
              <span style={{ fontSize: "16px", color: t.primary }}>{s.icon}</span>
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    color: t.dim,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "13px",
                    color: t.primary,
                  }}
                >
                  {s.value}
                </div>
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      <div
        style={{
          textAlign: "center",
          marginTop: "60px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          color: t.darkDim,
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          Built with React + TypeScript + Framer Motion
        </div>
        <div>© {new Date().getFullYear()} Aurimas Ransys — ransys.dev</div>
        <div style={{ marginTop: "4px", fontSize: "11px", color: t.darkDim }}>
          {"\u201cThere is no spoon.\u201d"}
        </div>
      </div>
    </section>
  );
}
