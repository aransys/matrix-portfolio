import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import type { ThemeKey } from "../config/themes";
import { SectionHeader } from "./SectionHeader";

export interface SectionProps {
  id: string;
  theme: ThemeKey;
  /** Small tag shown above the title, e.g. "// 01" */
  tag: string;
  title: string;
  /** Optional override for the default inner padding-bottom (used by Contact) */
  paddingBottom?: number | string;
  /** Optional override for the reveal container's inline style */
  contentStyle?: CSSProperties;
  children: ReactNode;
}

/**
 * Shared layout + scroll-reveal wrapper used by every content section.
 * Keeps the page consistent and removes the repeated boilerplate that used
 * to live at the top of every *Section component.
 */
export function Section({
  id,
  theme,
  tag,
  title,
  paddingBottom,
  contentStyle,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      style={{
        padding: `100px 20px ${paddingBottom ?? "100px"}`,
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <SectionHeader theme={theme} tag={tag} title={title} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        style={contentStyle}
      >
        {children}
      </motion.div>
    </section>
  );
}
