import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export interface WhiteRabbitProps {
  /** Counter — each new value spawns a fresh rabbit. */
  trigger: number;
  /** Fires when the user catches the rabbit. */
  onCaught: () => void;
}

/**
 * A small clickable rabbit glyph that hops across the screen for ~6s.
 * Catch it (click/tap) to fire `onCaught` — which jumps the user to the
 * Mission Log. Misses just let it disappear on its own.
 */
export function WhiteRabbit({ trigger, onCaught }: WhiteRabbitProps) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (trigger === 0) return;
    // Start somewhere off the right side, near the lower third
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Counter-driven one-shot: each new trigger picks a fresh spawn point
    // and shows the rabbit for 6s. setState in the body is intentional —
    // it's the kickoff of an animation timer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStart({ x: w + 60, y: Math.random() * (h * 0.4) + h * 0.4 });
    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), 6000);
    return () => window.clearTimeout(id);
  }, [trigger]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        aria-label="A white rabbit. Catch it."
        onClick={() => {
          setVisible(false);
          onCaught();
        }}
        initial={{ x: start.x, y: start.y, opacity: 1 }}
        animate={{
          x: -120,
          y: reduced ? start.y : [start.y, start.y - 30, start.y, start.y - 25, start.y],
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 6, ease: "linear" }}
        style={{
          position: "fixed",
          zIndex: 95,
          fontSize: "32px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          color: "var(--c-primary)",
          textShadow: "0 0 18px var(--c-glow)",
          filter: "drop-shadow(0 0 8px var(--c-glow))",
          userSelect: "none",
        }}
      >
        <span
          style={{
            display: "inline-block",
            animation: reduced ? "none" : "rabbitHop 0.5s ease-in-out infinite",
          }}
        >
          🐇
        </span>
      </motion.button>
    </AnimatePresence>
  );
}
