import { motion, useReducedMotion } from "framer-motion";
import { DecodeText } from "./ui/GlitchText";

export interface SectionHeaderProps {
  /** Numeric tag, e.g. "01" */
  tag: string;
  title: string;
  subtitle?: string;
}

/**
 * Cinematic section header — oversized numeral on the left, decoding
 * title on the right. Designed to feel like a scene slate.
 */
export function SectionHeader({ tag, title, subtitle }: SectionHeaderProps) {
  const reduced = useReducedMotion();
  return (
    <header
      style={{
        marginBottom: "clamp(36px, 5vw, 56px)",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "clamp(16px, 3vw, 28px)",
        alignItems: "end",
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="font-display"
        aria-hidden
        style={{
          fontSize: "clamp(48px, 8vw + 8px, 96px)",
          fontWeight: 700,
          lineHeight: 1,
          color: "var(--c-dim)",
          opacity: 0.55,
          letterSpacing: "-0.04em",
          whiteSpace: "nowrap",
        }}
      >
        {tag}
      </motion.div>

      <div style={{ minWidth: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="tag"
          style={{ marginBottom: "8px", display: "block" }}
        >
          // chapter {tag}
        </motion.div>

        <h2
          className="font-display"
          style={{
            fontSize: "clamp(28px, 4vw + 8px, 56px)",
            fontWeight: 700,
            color: "var(--c-primary)",
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {reduced ? title : <DecodeText text={title} speed={32} />}
        </h2>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              color: "var(--c-dim)",
              fontSize: "var(--t-base)",
              marginTop: "12px",
              maxWidth: "60ch",
            }}
          >
            {subtitle}
          </motion.p>
        )}

        <span className="heading-underline" aria-hidden />
      </div>
    </header>
  );
}
