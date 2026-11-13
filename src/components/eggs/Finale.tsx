import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { OWNER } from "../../config/data";
import { bendRain } from "../../trail/eggBridge";

export interface FinaleProps {
  open: boolean;
  onClose: () => void;
}

/** The end of the trail. */
const QUOTE =
  "What you know you can't explain, but you feel it. You've felt it your entire life, that there's something wrong with the world. You don't know what it is, but it's there, like a splinter in your mind, driving you mad.";

const TYPE_MS_PER_CHAR = 34;

/** How far the rain bends while the finale is up, and after it closes. */
const BEND_OPEN = 1;
const BEND_AFTER = 0.5;

/**
 * The end of the white-rabbit trail: the rain bends, and the line that
 * the whole site is built around types itself out. Once it has been
 * seen, the rain keeps bending around the pointer for the rest of the
 * visit.
 */
export function Finale({ open, onClose }: FinaleProps) {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    bendRain(BEND_OPEN);
    // The page steps back so only the rain and the words are left.
    document.documentElement.classList.add("finale-open");
    bodyRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    let id = 0;
    if (!reduced) {
      const start = performance.now();
      const tick = () => {
        const n = Math.min(QUOTE.length, Math.floor((performance.now() - start) / TYPE_MS_PER_CHAR));
        setTyped(n);
        if (n < QUOTE.length) id = window.setTimeout(tick, TYPE_MS_PER_CHAR);
      };
      id = window.setTimeout(tick, 900);
    }

    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      setTyped(0);
      document.documentElement.classList.remove("finale-open");
      bendRain(BEND_AFTER);
    };
  }, [open, reduced, onClose]);

  const shown = reduced ? QUOTE.length : typed;
  const done = shown >= QUOTE.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="finale"
          role="dialog"
          aria-modal="true"
          aria-label="The end of the trail"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={onClose}
        >
          <div
            ref={bodyRef}
            tabIndex={-1}
            className="finale__body"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tag">THE SPLINTER // 5 OF 5</div>

            {/* Screen readers get the whole line at once, not letter by letter. */}
            <p className="finale__quote font-display" aria-label={QUOTE}>
              <span aria-hidden>
                {QUOTE.slice(0, shown)}
                {!done && <span className="finale__caret" />}
              </span>
            </p>

            <div className={`finale__after${done ? " finale__after--in" : ""}`}>
              <p className="finale__credit">— Morpheus</p>
              <p className="finale__note">
                You felt it, and you followed it all the way down. Not many do.
                <br />
                If you write to me, mention the white rabbit. — {OWNER.name.split(" ")[0]}
              </p>
              <div className="finale__actions">
                <button
                  type="button"
                  className="finale__btn finale__btn--primary"
                  onClick={() => {
                    onClose();
                    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  send a signal
                </button>
                <button type="button" className="finale__btn" onClick={onClose}>
                  back to the rain
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
