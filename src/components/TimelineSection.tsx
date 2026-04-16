import { motion } from "framer-motion";
import { TIMELINE } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { SectionHeader } from "./SectionHeader";

export interface TimelineSectionProps {
  theme: ThemeKey;
}

export function TimelineSection({ theme }: TimelineSectionProps) {
  const t = THEMES[theme];
  return (
    <section
      id="timeline"
      style={{
        padding: "100px 20px",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <SectionHeader theme={theme} tag="// 04" title="Timeline" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        style={{ position: "relative", paddingLeft: "32px" }}
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
        {TIMELINE.map((item, i) => (
          <div
            key={item.title}
            style={{
              marginBottom: i < TIMELINE.length - 1 ? "32px" : 0,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "-29px",
                top: "6px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: i === 0 ? t.primary : t.darkDim,
                border: `2px solid ${t.primary}`,
                boxShadow: i === 0 ? `0 0 8px ${t.primary}44` : "none",
              }}
            />
            <div
              style={{
                background: "rgba(0,0,0,0.75)",
                border: `1px solid ${t.darkDim}`,
                borderRadius: "8px",
                padding: "20px 24px",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
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
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {item.title}
              </h3>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  color: t.secondary,
                  marginBottom: "8px",
                }}
              >
                {item.place}
              </div>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
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
        ))}
      </motion.div>
    </section>
  );
}
