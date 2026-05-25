import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EggKey } from "../config/commands";
import { PHRASE_TO_COMMAND } from "../config/commands";
import type { ThemeKey } from "../config/themes";
import { useKonamiCode, usePhraseDispatcher } from "../hooks/useKeySequence";
import { AgentSmith } from "./eggs/AgentSmith";
import { GlitchStorm } from "./eggs/GlitchStorm";
import { MessageToast } from "./eggs/MessageToast";
import { OperatorHud } from "./eggs/OperatorHud";
import { PillChoice } from "./eggs/PillChoice";
import { RebootSequence } from "./eggs/RebootSequence";
import { WhiteRabbit } from "./eggs/WhiteRabbit";

export interface EasterEggsProps {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
}

/**
 * Easter-egg orchestrator. Owns state for every effect, wires up every
 * trigger (Konami code, typed phrases, palette commands), and renders
 * the visible effect layers.
 *
 * Exposes its action surface via the global `__matrixEggs` object so the
 * command palette can dispatch into it without prop drilling. The
 * exposure is intentional — these are user-discoverable features, not
 * security-sensitive APIs.
 */
export function EasterEggs({ theme, setTheme }: EasterEggsProps) {
  // ---- state ----
  const [pillsOpen, setPillsOpen] = useState(false);
  const [agentSmithOn, setAgentSmithOn] = useState(false);
  const [operatorOn, setOperatorOn] = useState(false);
  const [glitchKey, setGlitchKey] = useState(0);
  const [rebootKey, setRebootKey] = useState(0);
  const [rabbitKey, setRabbitKey] = useState(0);

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

  // ---- egg dispatch ----
  const triggerEgg = useCallback(
    (key: EggKey) => {
      switch (key) {
        case "pills":
          setPillsOpen(true);
          break;
        case "agentSmith":
          setAgentSmithOn(true);
          showMessage("Mr. Anderson… Mr. Anderson… Mr. Anderson…", 3200);
          break;
        case "operatorMode":
          setOperatorOn(true);
          showMessage("Operator online. Telemetry locked.", 2400);
          break;
        case "glitchStorm":
          setGlitchKey((k) => k + 1);
          showMessage("Déjà vu.", 1800);
          break;
        case "reboot":
          setRebootKey((k) => k + 1);
          break;
        case "rabbit":
          setRabbitKey((k) => k + 1);
          showMessage("A white rabbit appeared… catch it.", 2400);
          break;
        case "fortyTwo":
          showMessage(
            "The answer is 42. The question? You're still inside it.",
            3600,
          );
          break;
      }
    },
    [showMessage],
  );

  const toggleEgg = useCallback(
    (key: EggKey) => {
      switch (key) {
        case "agentSmith":
          setAgentSmithOn((v) => {
            const next = !v;
            showMessage(next ? "Smith deployed." : "Smiths recalled.", 1800);
            return next;
          });
          break;
        case "operatorMode":
          setOperatorOn((v) => {
            const next = !v;
            showMessage(next ? "Operator online." : "Operator offline.", 1800);
            return next;
          });
          break;
        default:
          triggerEgg(key);
      }
    },
    [showMessage, triggerEgg],
  );

  // Expose to window for the command palette's CommandContext. Lives
  // here because the egg state is owned by this component — saves
  // threading callbacks through every layer that might trigger an egg.
  useEffect(() => {
    type GlobalWithEggs = Window & {
      __matrixEggs?: {
        triggerEgg: (k: EggKey) => void;
        toggleEgg: (k: EggKey) => void;
        showMessage: (m: string, ms?: number) => void;
      };
    };
    const w = window as GlobalWithEggs;
    w.__matrixEggs = { triggerEgg, toggleEgg, showMessage };
    return () => {
      delete w.__matrixEggs;
    };
  }, [triggerEgg, toggleEgg, showMessage]);

  // ---- triggers ----

  // Konami → operator HUD
  useKonamiCode(useCallback(() => toggleEgg("operatorMode"), [toggleEgg]));

  // Typed phrase dispatcher. Each phrase maps to a command id; the
  // command id maps onto an egg key or theme.
  const phraseMap = useMemo<Record<string, () => void>>(() => {
    const map: Record<string, () => void> = {};
    for (const [phrase, commandId] of Object.entries(PHRASE_TO_COMMAND)) {
      map[phrase] = () => {
        if (commandId.startsWith("theme.")) {
          const key = commandId.slice("theme.".length) as ThemeKey;
          setTheme(key);
          showMessage(`Theme set to ${key.toUpperCase()}`);
          return;
        }
        if (commandId.startsWith("egg.")) {
          const eggId = commandId.slice("egg.".length);
          const eggKey: EggKey | null =
            eggId === "pills"
              ? "pills"
              : eggId === "operator"
                ? "operatorMode"
                : eggId === "smith"
                  ? "agentSmith"
                  : eggId === "glitch"
                    ? "glitchStorm"
                    : eggId === "rabbit"
                      ? "rabbit"
                      : eggId === "reboot"
                        ? "reboot"
                        : eggId === "42"
                          ? "fortyTwo"
                          : null;
          if (eggKey) {
            if (eggKey === "operatorMode" || eggKey === "agentSmith") {
              toggleEgg(eggKey);
            } else {
              triggerEgg(eggKey);
            }
          }
        }
      };
    }
    map["42"] = () => triggerEgg("fortyTwo");
    return map;
  }, [setTheme, showMessage, toggleEgg, triggerEgg]);

  usePhraseDispatcher(phraseMap);

  // ---- render ----
  return (
    <>
      <PillChoice
        open={pillsOpen}
        onClose={() => setPillsOpen(false)}
        onChoose={(t) => setTheme(t)}
        onGlitchStorm={() => setGlitchKey((k) => k + 1)}
        onMessage={showMessage}
      />
      <AgentSmith active={agentSmithOn} />
      <OperatorHud active={operatorOn} theme={theme} />
      <GlitchStorm trigger={glitchKey} />
      <RebootSequence trigger={rebootKey} />
      <WhiteRabbit
        trigger={rabbitKey}
        onCaught={() => {
          showMessage("You caught the rabbit. It leads to the missions.", 2600);
          document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
      <MessageToast message={message} />
    </>
  );
}
