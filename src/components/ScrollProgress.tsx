import { motion, useScroll, useSpring } from "framer-motion";
import type { ThemeKey } from "../config/themes";

export interface ScrollProgressProps {
  theme: ThemeKey;
}

/**
 * Thin theme-coloured progress bar pinned to the top of the viewport.
 * Spring-smoothed so it eases into its target instead of tracking every
 * pixel — feels more polished and hides trackpad-momentum jitter.
 */
export function ScrollProgress({ theme: _theme }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    mass: 0.3,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background:
          "linear-gradient(to right, var(--c-primary), var(--c-accent))",
        transformOrigin: "0% 50%",
        scaleX,
        zIndex: 60,
        boxShadow: "0 0 10px var(--c-glow)",
        pointerEvents: "none",
      }}
    />
  );
}
