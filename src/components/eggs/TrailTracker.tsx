import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { openShell } from "../../trail/eggBridge";
import type { TrailStep } from "../../trail/trail";
import {
  TRAIL_STEPS,
  getFound,
  nextStep,
  resetTrail,
  subscribeTrail,
  trailCount,
} from "../../trail/trail";

export interface TrailTrackerProps {
  onOpenPills: () => void;
  onReplayFinale: () => void;
}

/**
 * The trail's guide: a small rabbit in the corner that says how much has
 * been found and, when opened, gives the next clue in plain words with a
 * button that takes the visitor to the right place. The steps themselves
 * still have to be done — this only makes sure nobody is left guessing.
 */
export function TrailTracker({ onOpenPills, onReplayFinale }: TrailTrackerProps) {
  const found = useSyncExternalStore(subscribeTrail, getFound);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const next = nextStep(found);
  const started = found.length > 0;
  const finished = found.length === TRAIL_STEPS.length;

  // Close on Escape or a click anywhere else.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  function go(step: TrailStep) {
    setOpen(false);
    switch (step.id) {
      case "hole":
      case "spoon":
        openShell();
        break;
      case "rabbit":
        document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "pill":
        // The rabbit is already caught: go straight to the choice.
        if (found.includes("rabbit")) onOpenPills();
        else document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "origin":
        document.getElementById("timeline")?.scrollIntoView({ behavior: "smooth" });
        break;
    }
  }

  return (
    <div ref={rootRef} className="trail">
      <AnimatePresence>
        {open && (
          <motion.div
            id="trail-panel"
            className="trail__panel glass glass--raised"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="trail__head">
              <span className="tag">Follow the white rabbit</span>
              <span className="trail__count">{trailCount(found)}</span>
            </div>

            <ol className="trail__steps">
              {TRAIL_STEPS.map((step) => {
                const done = found.includes(step.id);
                return (
                  <li key={step.id} className={done ? "trail__step trail__step--done" : "trail__step"}>
                    <span aria-hidden>{done ? "■" : "□"}</span>
                    {done ? step.label : step === next ? "you are here" : "? ? ?"}
                  </li>
                );
              })}
            </ol>

            {next ? (
              <div className="trail__next">
                <p className="trail__quote">&ldquo;{next.quote}&rdquo;</p>
                <p className="trail__clue">{next.clue}</p>
                <button type="button" className="trail__go" onClick={() => go(next)}>
                  {next.id === "pill" && found.includes("rabbit") ? "make the choice" : next.go} →
                </button>
              </div>
            ) : (
              <div className="trail__next">
                <p className="trail__quote">&ldquo;He is the One.&rdquo;</p>
                <p className="trail__clue">
                  You found all of it. The rain bends for you now.
                </p>
                <div className="trail__row">
                  <button
                    type="button"
                    className="trail__go"
                    onClick={() => {
                      setOpen(false);
                      onReplayFinale();
                    }}
                  >
                    see the ending again
                  </button>
                  <button
                    type="button"
                    className="trail__go trail__go--quiet"
                    onClick={() => resetTrail()}
                  >
                    start over
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className={`trail__chip${started ? "" : " trail__chip--invite"}`}
        aria-expanded={open}
        aria-controls="trail-panel"
        aria-label={`Follow the white rabbit — ${found.length} of ${TRAIL_STEPS.length} found`}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Re-keyed on every find so the hop replays. */}
        <span key={found.length} aria-hidden className="trail__rabbit">
          🐇
        </span>
        <span className="trail__label">
          {finished ? "you are the one" : started ? trailCount(found) : "follow the white rabbit"}
        </span>
      </button>
    </div>
  );
}
