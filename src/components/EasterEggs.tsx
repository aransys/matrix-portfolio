import { useCallback, useEffect, useRef, useState } from "react";
import type { EggKey } from "../config/commands";
import type { ThemeKey } from "../config/themes";
import { useKonamiCode } from "../hooks/useKeySequence";
import type { EggBridge } from "../trail/eggBridge";
import { getFound, markFound, trailCount } from "../trail/trail";
import { DejaVuCat } from "./eggs/DejaVuCat";
import { Finale } from "./eggs/Finale";
import { GlitchStorm } from "./eggs/GlitchStorm";
import { MessageToast } from "./eggs/MessageToast";
import { OperatorHud } from "./eggs/OperatorHud";
import { PillChoice } from "./eggs/PillChoice";
import { TrailTracker } from "./eggs/TrailTracker";

export interface EasterEggsProps {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  /** Switch the whole page to the plain CV view. */
  onRedPill: () => void;
}

/** Let the glitch storm play before the simulation drops away. */
const RED_PILL_DELAY_MS = 1100;

/** The black cat walks by on its own once per session, somewhere in here. */
const CAT_DELAY_MS = { min: 45_000, spread: 75_000 };
const CAT_SEEN_KEY = "ransys.dev:cat-seen";

/** Shown in the tab while the visitor is looking at something else. */
const AWAY_TITLE = "The Matrix has you…";

/**
 * Everything hidden on the site, in one place.
 *
 * - The white-rabbit trail (see `trail/trail.ts`): this component owns the
 *   pill choice, the finale and the tracker in the corner that hands out
 *   clues; the other steps live in the shell, the mission log and the
 *   timeline.
 * - Ambient touches nobody has to trigger: a black cat that walks past
 *   twice, and the tab title changing while the visitor is away.
 * - The operator HUD on the Konami code.
 *
 * The action surface is published on `window.__matrixEggs` so the palette,
 * the shell and the sections can reach it without prop drilling.
 */
export function EasterEggs({ theme, setTheme, onRedPill }: EasterEggsProps) {
  const [pillsOpen, setPillsOpen] = useState(false);
  const [operatorOn, setOperatorOn] = useState(false);
  const [finaleOpen, setFinaleOpen] = useState(false);
  const [glitchKey, setGlitchKey] = useState(0);
  const [catKey, setCatKey] = useState(0);

  const [message, setMessage] = useState<string | null>(null);
  const msgTimerRef = useRef<number | null>(null);

  /** Show a message; auto-hide after `ms`. */
  const showMessage = useCallback((msg: string, ms = 3000) => {
    if (msgTimerRef.current !== null) window.clearTimeout(msgTimerRef.current);
    setMessage(msg);
    msgTimerRef.current = window.setTimeout(() => {
      setMessage(null);
      msgTimerRef.current = null;
    }, ms);
  }, []);

  useEffect(() => {
    return () => {
      if (msgTimerRef.current !== null) window.clearTimeout(msgTimerRef.current);
    };
  }, []);

  const toggleEgg = useCallback(
    (key: EggKey) => {
      switch (key) {
        case "pills":
          setPillsOpen(true);
          break;
        case "operatorMode":
          setOperatorOn((on) => {
            showMessage(on ? "Operator offline." : "Operator online. Telemetry locked.", 2000);
            return !on;
          });
          break;
        case "dejaVu":
          setCatKey((k) => k + 1);
          break;
        case "finale":
          setFinaleOpen(true);
          break;
      }
    },
    [showMessage],
  );

  useEffect(() => {
    const w = window as unknown as { __matrixEggs?: EggBridge };
    w.__matrixEggs = { triggerEgg: toggleEgg, toggleEgg, showMessage };
    return () => {
      delete w.__matrixEggs;
    };
  }, [toggleEgg, showMessage]);

  useKonamiCode(useCallback(() => toggleEgg("operatorMode"), [toggleEgg]));

  // The cat: once per session, unprompted, while the page is being looked at.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(CAT_SEEN_KEY)) return;
    } catch {
      return;
    }
    const id = window.setTimeout(
      () => {
        if (document.hidden) return;
        try {
          window.sessionStorage.setItem(CAT_SEEN_KEY, "1");
        } catch {
          // ignore
        }
        setCatKey((k) => k + 1);
      },
      CAT_DELAY_MS.min + Math.random() * CAT_DELAY_MS.spread,
    );
    return () => window.clearTimeout(id);
  }, []);

  // The tab title, while the visitor is somewhere else.
  useEffect(() => {
    const original = document.title;
    const onVisibility = () => {
      document.title = document.hidden ? AWAY_TITLE : original;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.title = original;
    };
  }, []);

  return (
    <>
      <PillChoice
        open={pillsOpen}
        onClose={() => setPillsOpen(false)}
        onChoose={(t) => setTheme(t)}
        onRedPill={() => window.setTimeout(onRedPill, RED_PILL_DELAY_MS)}
        onGlitchStorm={() => setGlitchKey((k) => k + 1)}
        onMessage={(msg, ms) => {
          const first = markFound("pill");
          showMessage(first ? `${msg} [${trailCount(getFound())}]` : msg, ms);
        }}
      />
      <OperatorHud active={operatorOn} theme={theme} />
      <DejaVuCat trigger={catKey} onSecondPass={() => setGlitchKey((k) => k + 1)} />
      <GlitchStorm trigger={glitchKey} />
      <Finale open={finaleOpen} onClose={() => setFinaleOpen(false)} />
      <TrailTracker
        onOpenPills={() => setPillsOpen(true)}
        onReplayFinale={() => setFinaleOpen(true)}
      />
      <MessageToast message={message} />
    </>
  );
}
