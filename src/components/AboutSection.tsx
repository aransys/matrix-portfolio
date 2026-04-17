import { OWNER } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { cardStyle } from "../styles/tokens";
import { Section } from "./Section";

export interface AboutSectionProps {
  theme: ThemeKey;
}

export function AboutSection({ theme }: AboutSectionProps) {
  const t = THEMES[theme];

  return (
    <Section id="about" theme={theme} tag="// 01" title="About">
      <div style={cardStyle(t)}>
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
              }}
            >
              {OWNER.name}
            </h3>
          </div>
          <span
            style={{
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
            fontSize: "13px",
          }}
        >
          {OWNER.dossierFields.map((field) => (
            <div key={field.label}>
              <div
                style={{
                  color: t.dim,
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  marginBottom: "4px",
                }}
              >
                {field.label}
              </div>
              <div style={{ color: t.secondary }}>{field.value}</div>
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
              fontSize: "13px",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            {OWNER.bio}
          </p>
        </div>
      </div>
    </Section>
  );
}
