import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ThemeKey } from "../../config/themes";

export interface PillChoiceProps {
  open: boolean;
  onClose: () => void;
  onChoose: (theme: ThemeKey) => void;
  /** Red pill — leave the simulation for the plain CV view. */
  onRedPill: () => void;
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
  /** Theme this pill switches to. The red pill leaves the simulation instead. */
  theme?: ThemeKey;
  message: string;
}

const PILLS: Pill[] = [
  {
    id: "red",
    label: "Red",
    body: "You wake up. No simulation — just the plain, printable truth of who built this.",
    color: "#ff3b3b",
    glow: "rgba(255,59,59,0.5)",
    message: "You take the red pill. Welcome to the real world.",
  },
  {
    id: "blue",
    label: "Blue",
    body: "The story ends. You stay in the simulation and believe whatever you want to believe.",
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

/** Entrance timing: quick, and close together, so the screen feels immediate. */
const ENTER = { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };
const STAGGER_S = 0.055;

/**
 * The pill modal — Morpheus's choice as an interactive overlay.
 * Red leaves the simulation for the plain CV view; the others pick a theme.
 *
 * Built to stay smooth over the live rain: a plain dark scrim (no backdrop
 * blur, which re-filters the whole animated canvas every frame), and all
 * continuous motion done in CSS on `transform` alone.
 */
export function PillChoice({
  open,
  onClose,
  onChoose,
  onRedPill,
  onGlitchStorm,
  onMessage,
}: PillChoiceProps) {
  const firstPillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    firstPillRef.current?.focus({ preventScroll: true });
    // The page steps back so only the rain and the choice are on screen.
    document.documentElement.classList.add("pills-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("pills-open");
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pills"
          role="dialog"
          aria-modal="true"
          aria-label="The choice — pick a pill"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="pills__intro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ENTER}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tag">MORPHEUS // PROTOCOL 01</div>
            <p className="font-display pills__quote">
              &ldquo;This is your last chance. After this, there is no turning back.&rdquo;
            </p>
          </motion.div>

          <div className="pills__row" onClick={(e) => e.stopPropagation()}>
            {PILLS.map((pill, i) => (
              <motion.button
                key={pill.id}
                ref={i === 0 ? firstPillRef : undefined}
                type="button"
                className="pill"
                aria-label={`Take the ${pill.label.toLowerCase()} pill`}
                style={
                  {
                    "--pill": pill.color,
                    "--pill-glow": pill.glow,
                    "--float-delay": `${-i * 1.1}s`,
                  } as React.CSSProperties
                }
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...ENTER, delay: 0.06 + i * STAGGER_S }}
                onClick={() => {
                  onMessage(pill.message, 3400);
                  if (pill.theme) {
                    onChoose(pill.theme);
                  } else {
                    onGlitchStorm();
                    onRedPill();
                  }
                  onClose();
                }}
              >
                <span aria-hidden className="pill__capsule" />
                <span className="pill__label">{pill.label}</span>
                <span className="pill__body">{pill.body}</span>
              </motion.button>
            ))}
          </div>

          <motion.button
            type="button"
            className="pills__leave"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.25 }}
            onClick={onClose}
          >
            walk away
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
