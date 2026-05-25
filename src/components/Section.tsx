import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import type { ThemeKey } from "../config/themes";
import { SectionHeader } from "./SectionHeader";

export interface SectionProps {
  id: string;
  theme: ThemeKey;
  /** Numeric tag, e.g. "01" */
  tag: string;
  /** Subtitle line below the big title */
  subtitle?: string;
  title: string;
  /** Optional override for the default inner padding-bottom */
  paddingBottom?: number | string;
  /** Optional override for the reveal container's inline style */
  contentStyle?: CSSProperties;
  children: ReactNode;
}

/**
 * Shared layout + scroll-reveal wrapper. Each section paints its own glow
 * pool that fades in as it scrolls into view — gives the page a cinematic
 * "scene ignites" feel without per-section custom code.
 */
export function Section({
  id,
  theme: _theme,
  tag,
  subtitle,
  title,
  paddingBottom,
  contentStyle,
  children,
}: SectionProps) {
  const reducedMotion = useReducedMotion();

  const resolvedPaddingBottom =
    paddingBottom === undefined
      ? "clamp(80px, 8vw + 40px, 140px)"
      : typeof paddingBottom === "number"
        ? `${paddingBottom}px`
        : paddingBottom;

  return (
    <section
      id={id}
      style={{
        padding: `clamp(80px, 8vw + 40px, 140px) clamp(16px, 4vw, 28px) ${resolvedPaddingBottom}`,
        maxWidth: "980px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        whileInView={{ opacity: reducedMotion ? 0 : 1 }}
        viewport={{ once: true, margin: "-25%" }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(700px, 80%)",
          height: "300px",
          background:
            "radial-gradient(circle at center, var(--c-glow-soft) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      <SectionHeader tag={tag} title={title} subtitle={subtitle} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, margin: "-80px" }}
        style={contentStyle}
      >
        {children}
      </motion.div>
    </section>
  );
}
