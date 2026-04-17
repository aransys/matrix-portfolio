import { SOCIALS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { cardStyle } from "../styles/tokens";
import { Section } from "./Section";

export interface ContactSectionProps {
  theme: ThemeKey;
}

export function ContactSection({ theme }: ContactSectionProps) {
  const t = THEMES[theme];

  return (
    <Section
      id="contact"
      theme={theme}
      tag="// 05"
      title="Transmission"
      paddingBottom={80}
    >
      <div style={cardStyle(t)}>
        <p
          style={{
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
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${social.label}: ${social.value}`}
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
              <span style={{ fontSize: "16px", color: t.primary }}>
                {social.icon}
              </span>
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    color: t.dim,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                  }}
                >
                  {social.label}
                </div>
                <div style={{ fontSize: "13px", color: t.primary }}>
                  {social.value}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
          marginTop: "60px",
          fontSize: "12px",
          color: t.darkDim,
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          Built with React + TypeScript + Framer Motion
        </div>
        <div>© {new Date().getFullYear()} Aurimas Ransys — ransys.dev</div>
        <div style={{ marginTop: "4px", fontSize: "11px", color: t.darkDim }}>
          &ldquo;There is no spoon.&rdquo;
        </div>
      </footer>
    </Section>
  );
}
