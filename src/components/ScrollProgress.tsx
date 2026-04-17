import { motion, useScroll, useSpring } from "framer-motion";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface ScrollProgressProps {
  theme: ThemeKey;
}

/**
 * A thin, themed progress bar pinned to the top of the viewport that fills
 * left-to-right as the user scrolls the page.
 *
 * Uses Framer Motion's `useScroll` (0→1 normalised over the document) piped
 * through `useSpring` so the bar eases into its target width instead of
 * tracking every pixel — feels more polished and hides jitter from trackpad
 * momentum.
 *
 * Sits above <StickyNav> (z 60 > 50) so it stays visible even while the nav
 * is visible.
 */
export function ScrollProgress({ theme }: ScrollProgressProps) {
  const t = THEMES[theme];
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    mass: 0.3,
    // restDelta of 0.001 avoids pinning the animation thread once the user
    // stops scrolling — a tiny but measurable battery win on mobile.
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
        background: `linear-gradient(to right, ${t.primary}, ${t.accent})`,
        transformOrigin: "0% 50%",
        scaleX,
        zIndex: 60,
        boxShadow: `0 0 8px ${t.primary}88`,
        pointerEvents: "none",
      }}
    />
  );
}
