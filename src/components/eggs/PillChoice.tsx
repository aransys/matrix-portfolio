import { AnimatePresence, motion } from "framer-motion";
import type { ThemeKey } from "../../config/themes";

export interface PillChoiceProps {
  open: boolean;
  onClose: () => void;
  onChoose: (theme: ThemeKey) => void;
  /** Trigger a brief storm after a choice — caller decides which (red is more violent). */
  onGlitchStorm: () => void;
  onMessage: (msg: string, ms?: number) => void;
}

interface Pill {
  id: "red" | "blue" | "orange";
  label: string;
  body: string;
  color: string;
  glow: string;
  theme: ThemeKey;
  message: string;
}

const PILLS: Pill[] = [
  {
    id: "red",
    label: "Red",
    body: "You stay in Wonderland. I show you how deep the rabbit hole goes.",
    color: "#ff3b3b",
    glow: "rgba(255,59,59,0.5)",
    theme: "revolutions",
    message: "You take the red pill — Wonderland it is.",
  },
  {
    id: "blue",
    label: "Blue",
    body: "The story ends. You wake up in your bed and believe whatever you want to believe.",
    color: "#3b8bff",
    glow: "rgba(59,139,255,0.5)",
    theme: "reloaded",
    message: "You take the blue pill — the story ends.",
  },
  {
    id: "orange",
    label: "Orange",
    body: "Not on the menu. Off-script. The Architect won't approve.",
    color: "#ff9a2a",
    glow: "rgba(255,154,42,0.5)",
    theme: "matrix",
    message: "Off-menu. The system reverts to default.",
  },
];

/**
 * The pill modal — Morpheus's choice as an interactive overlay.
 * Three floating pills; each picks a theme and fires a thematic ripple.
 */
export function PillChoice({ open, onClose, onChoose, onGlitchStorm, onMessage }: PillChoiceProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="The choice — pick a pill"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 220,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(24px, 6vh, 60px) 16px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              textAlign: "center",
              maxWidth: "640px",
              marginBottom: "clamp(28px, 5vh, 56px)",
            }}
          >
            <div className="tag" style={{ marginBottom: "10px" }}>
              MORPHEUS // PROTOCOL 01
            </div>
            <p
              className="font-display"
              style={{
                fontSize: "clamp(20px, 2.5vw + 10px, 32px)",
                color: "var(--c-primary)",
                lineHeight: 1.3,
                margin: 0,
                fontWeight: 500,
              }}
            >
              &ldquo;This is your last chance. After this, there is no turning back.&rdquo;
            </p>
            <p
              style={{
                color: "var(--c-dim)",
                fontSize: "var(--t-sm)",
                marginTop: "12px",
              }}
            >
              Make your choice.
            </p>
          </motion.div>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              gap: "clamp(18px, 4vw, 40px)",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {PILLS.map((pill, i) => (
              <motion.button
                key={pill.id}
                type="button"
                aria-label={`Take the ${pill.label.toLowerCase()} pill`}
                onClick={() => {
                  onChoose(pill.theme);
                  onMessage(pill.message, 3400);
                  if (pill.id === "red") onGlitchStorm();
                  onClose();
                }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                whileHover={{ scale: 1.06, y: -6 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                  width: "min(180px, 38vw)",
                }}
              >
                {/* The pill shape */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 3.2 + i * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: "120px",
                    height: "62px",
                    borderRadius: "var(--r-pill)",
                    background: `linear-gradient(135deg, ${pill.color} 0%, ${pill.color} 50%, #1a1a1a 50%, #2a2a2a 100%)`,
                    boxShadow: `0 0 32px ${pill.glow}, inset 0 0 20px rgba(255,255,255,0.18), inset 0 -10px 30px rgba(0,0,0,0.35)`,
                    position: "relative",
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "16px",
                      width: "20px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.45)",
                      filter: "blur(3px)",
                    }}
                  />
                </motion.div>

                <div
                  style={{
                    fontSize: "12px",
                    color: pill.color,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  {pill.label}
                </div>
                <p
                  style={{
                    fontSize: "var(--t-sm)",
                    color: "var(--c-dim)",
                    lineHeight: 1.55,
                    margin: 0,
                    maxWidth: "180px",
                  }}
                >
                  {pill.body}
                </p>
              </motion.button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: "clamp(28px, 5vh, 48px)",
              padding: "8px 18px",
              background: "transparent",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--r-md)",
              color: "var(--c-dim)",
              fontFamily: "inherit",
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            walk away
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
