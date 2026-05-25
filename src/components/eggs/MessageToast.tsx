import { AnimatePresence, motion } from "framer-motion";

export interface MessageToastProps {
  message: string | null;
}

/**
 * Center-screen message used as the universal "easter egg activated"
 * acknowledgement. Auto-hide is controlled by the caller; this just
 * renders presence + animation.
 */
export function MessageToast({ message }: MessageToastProps) {
  return (
    <AnimatePresence>
      {message !== null && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10000,
            background: "rgba(0,0,0,0.92)",
            border: "1px solid var(--c-border-strong)",
            borderRadius: "var(--r-md)",
            padding: "20px 36px",
            fontSize: "var(--t-base)",
            color: "var(--c-primary)",
            textAlign: "center",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            maxWidth: "90vw",
            boxShadow: "0 24px 60px -20px rgba(0,0,0,0.7), 0 0 40px var(--c-glow-soft)",
            letterSpacing: "0.02em",
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
