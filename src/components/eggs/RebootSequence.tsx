import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export interface RebootSequenceProps {
  /** Counter — each new value triggers a fresh reboot. */
  trigger: number;
}

/**
 * "Wake up, Neo." — a brief, dramatic full-screen reboot.
 *
 * Black-out → typed line ascends → green flash → reveal. Total runtime
 * about 2.2s. The component owns its own visibility lifecycle so
 * triggering it again mid-animation just restarts the sequence.
 */
export function RebootSequence({ trigger }: RebootSequenceProps) {
  const [active, setActive] = useState(false);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (trigger === 0) return;
    setActive(true);
    setTyped("");

    const line = "Wake up, Neo...";
    let i = 0;
    const typingId = window.setInterval(() => {
      i++;
      setTyped(line.slice(0, i));
      if (i >= line.length) window.clearInterval(typingId);
    }, 90);

    const hideId = window.setTimeout(() => {
      setActive(false);
    }, 2200);

    return () => {
      window.clearInterval(typingId);
      window.clearTimeout(hideId);
    };
  }, [trigger]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "var(--c-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.2, times: [0, 0.1, 0.85, 1] }}
            style={{
              fontSize: "clamp(20px, 3vw + 10px, 36px)",
              color: "var(--c-primary)",
              fontFamily: "inherit",
              textShadow: "0 0 20px var(--c-glow)",
              letterSpacing: "0.02em",
            }}
          >
            {typed}
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "20px",
                background: "var(--c-primary)",
                marginLeft: "4px",
                verticalAlign: "text-bottom",
                animation: "cursorBlink 0.5s step-end infinite",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
