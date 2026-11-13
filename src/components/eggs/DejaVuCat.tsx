import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export interface DejaVuCatProps {
  /** Counter — each new value plays the déjà vu once. */
  trigger: number;
  /** Fires as the cat starts its second, identical walk. */
  onSecondPass: () => void;
}

const PASS_MS = 3200;
const GAP_MS = 500;

/**
 * Déjà vu: a black cat walks along the bottom of the screen — then the
 * very same cat does the very same walk again. "A déjà vu is usually a
 * glitch in the Matrix." Purely decorative, never interactive.
 */
export function DejaVuCat({ trigger, onSecondPass }: DejaVuCatProps) {
  const reduced = useReducedMotion();
  /** 0 = off stage; 1 and 2 = which walk is playing. */
  const [pass, setPass] = useState(0);

  useEffect(() => {
    if (trigger === 0 || reduced) return;
    // Counter-driven one-shot, same pattern as GlitchStorm: the timers are
    // the external system being synced.
    setPass(1);
    const second = window.setTimeout(() => {
      setPass(2);
      onSecondPass();
    }, PASS_MS + GAP_MS);
    const done = window.setTimeout(() => setPass(0), PASS_MS * 2 + GAP_MS);
    return () => {
      window.clearTimeout(second);
      window.clearTimeout(done);
      setPass(0);
    };
    // onSecondPass is a fresh closure each render; only the trigger restarts this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, reduced]);

  if (pass === 0) return null;

  return (
    <div
      key={pass}
      aria-hidden
      className="deja-cat"
      style={{ animationDuration: `${PASS_MS}ms` }}
    >
      <span className="deja-cat__body">🐈</span>
    </div>
  );
}
