import { motion } from "framer-motion";
import { TIMELINE } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { Section } from "./Section";

export interface TimelineSectionProps {
  theme: ThemeKey;
}

/**
 * Timeline — a vertical rail of milestones. The current entry pulses
 * a soft glow; older entries fade quietly down the rail.
 */
export function TimelineSection({ theme }: TimelineSectionProps) {
  return (
    <Section
      id="timeline"
      theme={theme}
      tag="04"
      title="Trajectory"
      subtitle="Education, service, and the path that led here."
      contentStyle={{ position: "relative", paddingLeft: "44px" }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "16px",
          top: 0,
          bottom: 0,
          width: "2px",
          background:
            "linear-gradient(to bottom, var(--c-primary), var(--c-dark-dim))",
          opacity: 0.45,
        }}
      />
      {TIMELINE.map((item, i) => {
        const isCurrent = i === 0;
        const isLast = i === TIMELINE.length - 1;
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            style={{
              marginBottom: isLast ? 0 : "36px",
              position: "relative",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "-43px",
                top: "2px",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "var(--c-bg)",
                border: `2px solid ${isCurrent ? "var(--c-primary)" : "var(--c-dim)"}`,
                boxShadow: isCurrent ? "0 0 16px var(--c-glow)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isCurrent ? "var(--c-primary)" : "var(--c-dim)",
                fontFamily: "inherit",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                lineHeight: 1,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              className="glass"
              style={{
                padding: "20px 24px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--c-dim)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {item.period}
              </span>
              <h3
                className="font-display"
                style={{
                  fontSize: "var(--t-md)",
                  fontWeight: 700,
                  color: "var(--c-primary)",
                  margin: "6px 0 2px",
                  letterSpacing: "-0.01em",
                }}
              >
                {item.title}
              </h3>
              <div
                style={{
                  fontSize: "var(--t-sm)",
                  color: "var(--c-secondary)",
                  marginBottom: "10px",
                }}
              >
                {item.place}
              </div>
              <p
                style={{
                  fontSize: "var(--t-sm)",
                  color: "var(--c-dim)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {item.detail}
              </p>
            </div>
          </motion.div>
        );
      })}
    </Section>
  );
}
