import { TIMELINE } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { cardStyle } from "../styles/tokens";
import { Section } from "./Section";

export interface TimelineSectionProps {
  theme: ThemeKey;
}

export function TimelineSection({ theme }: TimelineSectionProps) {
  const t = THEMES[theme];

  return (
    <Section
      id="timeline"
      theme={theme}
      tag="// 04"
      title="Timeline"
      contentStyle={{ position: "relative", paddingLeft: "32px" }}
    >
      <div
        style={{
          position: "absolute",
          left: "8px",
          top: 0,
          bottom: 0,
          width: "2px",
          background: `linear-gradient(to bottom, ${t.primary}, ${t.darkDim})`,
          opacity: 0.4,
        }}
      />
      {TIMELINE.map((item, i) => {
        const isCurrent = i === 0;
        const isLast = i === TIMELINE.length - 1;
        return (
          <div
            key={item.title}
            style={{
              marginBottom: isLast ? 0 : "32px",
              position: "relative",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "-35px",
                top: "2px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: t.bg,
                border: `2px solid ${isCurrent ? t.primary : t.dim}`,
                boxShadow: isCurrent ? `0 0 10px ${t.primary}55` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // Index-number styling: themed mono, tight letter-spacing
                // so "01" fits comfortably inside the 24px disc.
                color: isCurrent ? t.primary : t.dim,
                fontFamily: "inherit",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                lineHeight: 1,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={cardStyle(t, { padding: "20px 24px" })}>
              <span
                style={{
                  fontSize: "11px",
                  color: t.dim,
                  letterSpacing: "2px",
                }}
              >
                {item.period}
              </span>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: t.primary,
                  margin: "6px 0 2px",
                }}
              >
                {item.title}
              </h3>
              <div
                style={{
                  fontSize: "12px",
                  color: t.secondary,
                  marginBottom: "8px",
                }}
              >
                {item.place}
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: t.dim,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {item.detail}
              </p>
            </div>
          </div>
        );
      })}
    </Section>
  );
}
