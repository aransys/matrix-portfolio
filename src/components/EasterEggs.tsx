import { useCallback, useState } from "react";
import type { ThemeKey } from "../config/themes";
import { useKonamiCode, usePhraseDetector } from "../hooks/useEasterEggs";

interface EasterEggsProps {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

export default function EasterEggs({ theme, setTheme }: EasterEggsProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [secretMessage, setSecretMessage] = useState("");

  const handleKonami = useCallback(() => {
    setSecretMessage("SYSTEM UNLOCK: ADMIN ACCESS GRANTED");
    setShowSecret(true);
    setTimeout(() => setShowSecret(false), 3000);
    console.log(
      "%c🟢 KONAMI CODE ACTIVATED",
      "color: #00ff41; font-size: 16px; font-weight: bold",
    );
  }, []);

  const handleNoSpoon = useCallback(() => {
    setSecretMessage("...there is no spoon.");
    setShowSecret(true);
    setTimeout(() => setShowSecret(false), 2500);

    const themes: ThemeKey[] = ["matrix", "reloaded", "revolutions"];
    let idx = themes.indexOf(theme);
    let cycles = 0;
    const startTheme = theme;

    const interval = setInterval(() => {
      idx = (idx + 1) % themes.length;
      setTheme(themes[idx]);
      cycles++;

      if (cycles >= 6) {
        clearInterval(interval);
        setTheme(startTheme);
      }
    }, 150);
  }, [theme, setTheme]);

  const handleWhatIsMatrix = useCallback(() => {
    setSecretMessage("The Matrix is everywhere. It is all around us.");
    setShowSecret(true);
    setTimeout(() => setShowSecret(false), 4000);
    console.log(
      "%cThe Matrix is a system, Neo. That system is us.",
      "color: #4499ff; font-size: 14px; font-style: italic",
    );
  }, []);

  const handleWhiteRabbit = useCallback(() => {
    setSecretMessage("Follow the white rabbit...");
    setShowSecret(true);
    setTimeout(() => setShowSecret(false), 2000);

    setTimeout(() => {
      document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
    }, 500);
  }, []);

  const handleRedPill = useCallback(() => {
    setSecretMessage("You take the red pill—you stay in Wonderland.");
    setShowSecret(true);
    setTheme("revolutions");
    setTimeout(() => setShowSecret(false), 3000);
  }, [setTheme]);

  const handleBluePill = useCallback(() => {
    setSecretMessage("You take the blue pill—the story ends.");
    setShowSecret(true);
    setTheme("reloaded");
    setTimeout(() => setShowSecret(false), 3000);
  }, [setTheme]);

  const handleWakeUpNeo = useCallback(() => {
    setSecretMessage("Wake up, Neo...");
    setShowSecret(true);

    const glitch = document.createElement("div");
    glitch.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #00ff41;
      z-index: 9999;
      opacity: 0.15;
      pointer-events: none;
      animation: glitchFlash 0.3s ease-out;
    `;
    document.body.appendChild(glitch);

    setTimeout(() => {
      document.body.removeChild(glitch);
    }, 300);

    setTimeout(() => setShowSecret(false), 2500);
  }, []);

  const handleShowMe = useCallback(() => {
    setSecretMessage(
      'Easter eggs: Konami (↑↑↓↓←→←→BA), "thereisnospoon", whatisthematrix, followthewhiterabbit, redpill, bluepill, wakeupneo',
    );
    setShowSecret(true);
    setTimeout(() => setShowSecret(false), 5000);
  }, []);

  useKonamiCode(handleKonami);
  usePhraseDetector("thereisnospoon", handleNoSpoon);
  usePhraseDetector("whatisthematrix", handleWhatIsMatrix);
  usePhraseDetector("followthewhiterabbit", handleWhiteRabbit);
  usePhraseDetector("redpill", handleRedPill);
  usePhraseDetector("bluepill", handleBluePill);
  usePhraseDetector("wakeupneo", handleWakeUpNeo);
  usePhraseDetector("showme", handleShowMe);

  const borderColor =
    theme === "matrix" ? "#00ff41" : theme === "reloaded" ? "#4499ff" : "#ff9922";
  const textColor =
    theme === "matrix" ? "#00ff41" : theme === "reloaded" ? "#4499ff" : "#ff9922";

  return (
    <>
      {showSecret && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.95)",
            border: `2px solid ${borderColor}`,
            borderRadius: "8px",
            padding: "24px 48px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "16px",
            color: textColor,
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
