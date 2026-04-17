import { useCallback, useEffect, useRef, useState } from "react";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { useKonamiCode, usePhraseDetector } from "../hooks/useKeySequence";

export interface EasterEggsProps {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

export function EasterEggs({ theme, setTheme }: EasterEggsProps) {
  const [secretMessage, setSecretMessage] = useState<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const spoonIntervalRef = useRef<number | null>(null);
  const accent = THEMES[theme].primary;

  /** Show a message for `duration` ms, cancelling any previous timer. */
  const reveal = useCallback((message: string, duration = 3000) => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
    }
    setSecretMessage(message);
    hideTimerRef.current = window.setTimeout(() => {
      setSecretMessage(null);
      hideTimerRef.current = null;
    }, duration);
  }, []);

  // Cleanup on unmount — stop any pending reveal or theme-flicker timer.
  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
      if (spoonIntervalRef.current !== null) {
        window.clearInterval(spoonIntervalRef.current);
      }
    };
  }, []);

  const handleKonami = useCallback(() => {
    reveal("SYSTEM UNLOCK: ADMIN ACCESS GRANTED");
    console.log(
      "%c🟢 KONAMI CODE ACTIVATED",
      "color: #00ff41; font-size: 16px; font-weight: bold",
    );
  }, [reveal]);

  const handleNoSpoon = useCallback(() => {
    reveal("...there is no spoon.", 2500);

    // If a previous spoon flicker is still running, cancel it first so the
    // two don't fight over setTheme.
    if (spoonIntervalRef.current !== null) {
      window.clearInterval(spoonIntervalRef.current);
    }

    const themes: ThemeKey[] = ["matrix", "reloaded", "revolutions"];
    const startTheme = theme;
    let idx = themes.indexOf(startTheme);
    let cycles = 0;

    spoonIntervalRef.current = window.setInterval(() => {
      idx = (idx + 1) % themes.length;
      setTheme(themes[idx]);
      cycles += 1;

      if (cycles >= 6) {
        if (spoonIntervalRef.current !== null) {
          window.clearInterval(spoonIntervalRef.current);
          spoonIntervalRef.current = null;
        }
        setTheme(startTheme);
      }
    }, 150);
  }, [reveal, theme, setTheme]);

  const handleWhatIsMatrix = useCallback(() => {
    reveal("The Matrix is everywhere. It is all around us.", 4000);
    console.log(
      "%cThe Matrix is a system, Neo. That system is us.",
      "color: #4499ff; font-size: 14px; font-style: italic",
    );
  }, [reveal]);

  const handleWhiteRabbit = useCallback(() => {
    reveal("Follow the white rabbit...", 2000);
    window.setTimeout(() => {
      document
        .getElementById("projects")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 500);
  }, [reveal]);

  const handleRedPill = useCallback(() => {
    reveal("You take the red pill—you stay in Wonderland.");
    setTheme("revolutions");
  }, [reveal, setTheme]);

  const handleBluePill = useCallback(() => {
    reveal("You take the blue pill—the story ends.");
    setTheme("reloaded");
  }, [reveal, setTheme]);

  const handleWakeUpNeo = useCallback(() => {
    reveal("Wake up, Neo...", 2500);

    const glitch = document.createElement("div");
    glitch.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${accent};
      z-index: 9999;
      opacity: 0.15;
      pointer-events: none;
      animation: glitchFlash 0.3s ease-out;
    `;
    document.body.appendChild(glitch);

    window.setTimeout(() => {
      glitch.remove();
    }, 300);
  }, [reveal, accent]);

  const handleShowMe = useCallback(() => {
    reveal(
      'Easter eggs: Konami (↑↑↓↓←→←→BA), "thereisnospoon", whatisthematrix, followthewhiterabbit, redpill, bluepill, wakeupneo',
      5000,
    );
  }, [reveal]);

  useKonamiCode(handleKonami);
  usePhraseDetector("thereisnospoon", handleNoSpoon);
  usePhraseDetector("whatisthematrix", handleWhatIsMatrix);
  usePhraseDetector("followthewhiterabbit", handleWhiteRabbit);
  usePhraseDetector("redpill", handleRedPill);
  usePhraseDetector("bluepill", handleBluePill);
  usePhraseDetector("wakeupneo", handleWakeUpNeo);
  usePhraseDetector("showme", handleShowMe);

  return (
    <>
      {secretMessage !== null && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.95)",
            border: `2px solid ${accent}`,
            borderRadius: "8px",
            padding: "24px 48px",
            fontSize: "16px",
            color: accent,
            textAlign: "center",
            backdropFilter: "blur(8px)",
            animation: "fadeInUp 0.3s ease-out",
            maxWidth: "90%",
            wordWrap: "break-word",
          }}
        >
          {secretMessage}
        </div>
      )}

      <style>{`
        @keyframes glitchFlash {
          0% { opacity: 0.3; }
          50% { opacity: 0.1; }
          100% { opacity: 0; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
