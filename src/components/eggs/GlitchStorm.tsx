import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export interface GlitchStormProps {
  /** Counter — each new value triggers a fresh storm. */
  trigger: number;
}

/**
 * Page-wide tear in the simulation. Three stacked layers — scanlines, a
 * chromatic-aberration band, and a brief flash — that play out in
 * ~1.4s. Stateful so triggering it again while it's running just
 * restarts the animation.
 */
export function GlitchStorm({ trigger }: GlitchStormProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    // Trigger is a parent-owned counter; each new value kicks off one
    // play-through. setState in the effect body is fine here — the timer
    // is the external system being synced.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(true);
    const t = window.setTimeout(() => setActive(false), 1400);
    return () => window.clearTimeout(t);
  }, [trigger]);

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Scanline storm */}
          <motion.div
            key={`storm-${trigger}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0.3, 0.7, 0.2, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, times: [0, 0.1, 0.25, 0.45, 0.65, 0.85, 1] }}
            aria-hidden
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9990,
              pointerEvents: "none",
              background: `repeating-linear-gradient(
                0deg,
                transparent 0,
                transparent 2px,
                rgba(255,255,255,0.06) 3px,
                transparent 4px
              )`,
              mixBlendMode: "screen",
            }}
          />
          {/* Color tear */}
          <motion.div
            key={`tear-${trigger}`}
            initial={{ opacity: 0, x: 0 }}
            animate={{
              opacity: [0, 0.35, 0, 0.4, 0],
              x: [0, -8, 6, -4, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, times: [0, 0.2, 0.4, 0.7, 1] }}
            aria-hidden
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9991,
              pointerEvents: "none",
              background:
                "linear-gradient(180deg, rgba(255,80,120,0.4) 0%, transparent 35%, transparent 65%, rgba(80,180,255,0.4) 100%)",
              mixBlendMode: "screen",
            }}
          />
          {/* Flash */}
          <motion.div
            key={`flash-${trigger}`}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            aria-hidden
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9992,
              pointerEvents: "none",
              background: "var(--c-primary)",
              mixBlendMode: "screen",
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}
