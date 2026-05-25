import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BootLineType } from "../config/boot-sequence";
import { BOOT_LINES } from "../config/boot-sequence";
import { NAV_LINKS, OWNER } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { WARN_ACCENT } from "../styles/tokens";
import { useTapPattern } from "../hooks/useTapPattern";
import { DecodeText, GlitchText } from "./ui/GlitchText";
import type { EggKey } from "../config/commands";
import { TerminalPrompt } from "./TerminalPrompt";
import type { TerminalLine, TerminalLineType } from "./TerminalPrompt";

export interface TerminalHeroProps {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  onOpenPalette: () => void;
}

type DisplayLineType = BootLineType | TerminalLineType;
interface DisplayLine {
  text: string;
  type: DisplayLineType;
}

/**
 * Cinematic hero.
 *
 * Phase 1 — boot terminal occupies the upper centre, glyphs stream past in
 *           the background. Boot lines play out at their configured speeds.
 * Phase 2 — boot finishes; the operator's name takes the stage with a
 *           decode reveal, and the navigation row + Cmd+K hint slide in.
 *
 * The optional bottom drawer reveals an interactive shell on demand (also
 * triggerable from the command palette).
 */
export function TerminalHero({ theme, setTheme, onOpenPalette }: TerminalHeroProps) {
  const [lines, setLines] = useState<DisplayLine[]>([]);
  const [bootDone, setBootDone] = useState(false);
  const [typing, setTyping] = useState<DisplayLine | null>(null);
  const [shellOpen, setShellOpen] = useState(false);
  const cancelRef = useRef(false);
  const bootStartedRef = useRef(false);
  const reducedMotion = useReducedMotion();

  // Parallax: as the user scrolls, the hero gently lifts and fades
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 600], [1, 0.96]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runBoot = useCallback(async () => {
    if (bootStartedRef.current) return;
    bootStartedRef.current = true;
    cancelRef.current = false;
    setLines([]);
    setBootDone(false);

    for (const line of BOOT_LINES) {
      if (cancelRef.current) break;
      if (line.type === "glitch") continue;

      if (line.typeSpeed) {
        for (let i = 0; i <= line.text.length; i++) {
          if (cancelRef.current) break;
          setTyping({ text: line.text.slice(0, i), type: line.type });
          await sleep(line.typeSpeed);
        }
        setLines((prev) => [...prev, { text: line.text, type: line.type }]);
        setTyping(null);
      } else {
        setLines((prev) => [...prev, { text: line.text, type: line.type }]);
      }
      if (!cancelRef.current) await sleep(line.delay);
    }

    setBootDone(true);
  }, []);

  const skipBoot = useCallback(() => {
    cancelRef.current = true;
    setTyping(null);
    const allLines: DisplayLine[] = BOOT_LINES.filter((l) => l.type !== "glitch").map(
      (l) => ({ text: l.text, type: l.type }),
    );
    setLines(allLines);
    setBootDone(true);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void runBoot();
    });
    return () => {
      cancelRef.current = true;
    };
  }, [runBoot]);

  return (
    <section
      id="hero"
      style={{
        minHeight: "100dvh",
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(60px, 8vh, 100px) clamp(16px, 4vw, 28px)",
        gap: "clamp(24px, 4vh, 40px)",
        overflow: "hidden",
      }}
    >
      <motion.div
        style={{
          y: reducedMotion ? 0 : heroY,
          opacity: reducedMotion ? 1 : heroOpacity,
          scale: reducedMotion ? 1 : heroScale,
          width: "100%",
          maxWidth: "900px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(20px, 3vh, 32px)",
        }}
      >
        <AnimatePresence mode="wait">
          {!bootDone ? (
            <BootTerminal
              key="boot"
              lines={lines}
              typing={typing}
              onSkip={skipBoot}
            />
          ) : (
            <RevealedHero
              key="revealed"
              theme={theme}
              setTheme={setTheme}
              onOpenPalette={onOpenPalette}
              shellOpen={shellOpen}
              setShellOpen={setShellOpen}
              scrollback={lines
                .filter((l) => l.type !== "name" && l.type !== "role")
                .map(toTerminalLine)}
              appendLines={(newLines) =>
                setLines((prev) => [...prev, ...newLines.map((l) => ({ ...l }))])
              }
              clearScrollback={() =>
                setLines((prev) =>
                  prev.filter((l) => l.type === "name" || l.type === "role"),
                )
              }
            />
          )}
        </AnimatePresence>
      </motion.div>

      <ScrollIndicator visible={bootDone} />
    </section>
  );
}

function toTerminalLine(l: DisplayLine): TerminalLine {
  const allowed: TerminalLineType[] = ["ok", "warn", "echo", "dim"];
  return {
    text: l.text,
    type: (allowed.includes(l.type as TerminalLineType)
      ? l.type
      : "dim") as TerminalLineType,
  };
}

/* ---------------- Boot terminal pane (phase 1) ---------------- */

interface BootTerminalProps {
  lines: DisplayLine[];
  typing: DisplayLine | null;
  onSkip: () => void;
}

function BootTerminal({ lines, typing, onSkip }: BootTerminalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="glass glass--raised"
      style={{
        width: "100%",
        maxWidth: "720px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderBottom: "1px solid var(--c-border)",
        }}
      >
        <Dot color="#ff5f57" />
        <Dot color="#ffbd2e" />
        <Dot color="#28c940" />
        <span
          style={{
            color: "var(--c-dim)",
            fontSize: "12px",
            marginLeft: "8px",
            letterSpacing: "0.05em",
          }}
        >
          ransys.dev — zsh
        </span>
      </div>

      <div
        style={{
          padding: "20px 24px 28px",
          fontSize: "13px",
          lineHeight: 1.7,
          minHeight: "clamp(280px, 36vh, 360px)",
          position: "relative",
        }}
      >
        <span className="scanline" />

        {lines.map((line, i) => (
          <div key={i} style={lineStyle(line.type)}>
            {line.text || " "}
          </div>
        ))}

        {typing && (
          <div style={lineStyle(typing.type)}>
            {typing.text}
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: "8px",
                height: "14px",
                background: "var(--c-primary)",
                marginLeft: "2px",
                verticalAlign: "text-bottom",
                animation: "cursorBlink 0.7s step-end infinite",
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={onSkip}
          aria-label="Skip boot sequence"
          style={{
            position: "absolute",
            bottom: "12px",
            right: "16px",
            background: "transparent",
            border: "1px solid var(--c-dim)",
            color: "var(--c-dim)",
            fontFamily: "inherit",
            fontSize: "11px",
            padding: "4px 14px",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          skip &gt;
        </button>
      </div>
    </motion.div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      style={{ width: 10, height: 10, borderRadius: "50%", background: color }}
    />
  );
}

function lineStyle(type: DisplayLineType): CSSProperties {
  const base: CSSProperties = {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: "13px",
  };
  const color =
    type === "ok" || type === "name"
      ? "var(--c-primary)"
      : type === "warn"
        ? WARN_ACCENT
        : type === "role"
          ? "var(--c-secondary)"
          : type === "echo"
            ? "var(--c-secondary)"
            : "var(--c-dim)";
  if (type === "name") {
    return {
      ...base,
      color,
      fontSize: "clamp(20px, 5vw, 32px)",
      fontWeight: 700,
      letterSpacing: "3px",
    };
  }
  if (type === "role") {
    return { ...base, color, fontSize: "clamp(14px, 3vw, 18px)" };
  }
  return { ...base, color };
}

/* ---------------- Revealed hero (phase 2) ---------------- */

interface RevealedHeroProps {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  onOpenPalette: () => void;
  shellOpen: boolean;
  setShellOpen: (open: boolean) => void;
  scrollback: TerminalLine[];
  appendLines: (lines: TerminalLine[]) => void;
  clearScrollback: () => void;
}

function RevealedHero({
  theme,
  setTheme,
  onOpenPalette,
  shellOpen,
  setShellOpen,
  scrollback,
  appendLines,
  clearScrollback,
}: RevealedHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(20px, 3vh, 36px)",
        textAlign: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          padding: "6px 14px",
          borderRadius: "var(--r-pill)",
          border: "1px solid var(--c-border-strong)",
          background: "var(--c-pill-bg)",
          fontSize: "11px",
          color: "var(--c-primary)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--c-primary)",
            boxShadow: "0 0 8px var(--c-glow)",
          }}
        />
        Signal Acquired · Online
      </motion.div>

      <HeroName />


      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        <div
          style={{
            fontSize: "var(--t-md)",
            color: "var(--c-secondary)",
            letterSpacing: "0.05em",
          }}
        >
          <GlitchText text="Full Stack Developer" />
        </div>
        <div
          className="tag"
          style={{
            color: "var(--c-dim)",
            fontSize: "var(--t-sm)",
            letterSpacing: "0.18em",
          }}
        >
          CS @ Leeds Beckett · Kaunas → Leeds
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "clamp(10px, 1.6vw, 18px)",
          marginTop: "8px",
        }}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="lift"
            style={{
              color: "var(--c-dim)",
              fontSize: "var(--t-sm)",
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: "var(--r-sm)",
              transition: "color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--c-primary)";
              e.currentTarget.style.background = "var(--c-glow-soft)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--c-dim)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {link.heroLabel}
          </a>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "8px",
        }}
      >
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Open command palette"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 16px",
            background: "var(--c-pill-bg)",
            border: "1px solid var(--c-border-strong)",
            borderRadius: "var(--r-md)",
            color: "var(--c-primary)",
            fontFamily: "inherit",
            fontSize: "var(--t-sm)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 0 24px var(--c-glow-soft)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <span aria-hidden>⌘</span>
          <span>open command palette</span>
          <kbd
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "3px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid var(--c-border)",
              color: "var(--c-dim)",
              letterSpacing: "1px",
            }}
          >
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setShellOpen(!shellOpen)}
          aria-expanded={shellOpen}
          aria-controls="hero-shell"
          style={{
            padding: "10px 16px",
            background: "transparent",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--r-md)",
            color: "var(--c-dim)",
            fontFamily: "inherit",
            fontSize: "var(--t-sm)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--c-primary)";
            e.currentTarget.style.borderColor = "var(--c-border-strong)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--c-dim)";
            e.currentTarget.style.borderColor = "var(--c-border)";
          }}
        >
          {shellOpen ? "close shell ▴" : "drop into shell ▾"}
        </button>
      </motion.div>

      <AnimatePresence>
        {shellOpen && (
          <motion.div
            id="hero-shell"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: "100%", maxWidth: "720px", overflow: "hidden" }}
          >
            <div
              className="glass glass--raised"
              style={{
                marginTop: "8px",
                padding: "20px 22px",
                textAlign: "left",
                position: "relative",
                maxHeight: "min(50vh, 400px)",
                overflowY: "auto",
              }}
            >
              <span className="scanline" />
              <TerminalPrompt
                theme={theme}
                setTheme={setTheme}
                history={scrollback}
                appendLines={appendLines}
                clearScrollback={clearScrollback}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HeroName() {
  // Triple-tap the name to summon the pill choice — the mobile-friendly
  // counterpart to typing "redpill". Dispatches through the global egg
  // bridge so we don't need to thread callbacks down to this component.
  const onTriplePress = useTapPattern(3, () => {
    type EggBridge = {
      triggerEgg: (k: EggKey) => void;
    };
    const eggs = (window as unknown as { __matrixEggs?: EggBridge }).__matrixEggs;
    eggs?.triggerEgg("pills");
  });

  return (
    <motion.h1
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      onClick={onTriplePress}
      className="font-display"
      style={{
        fontSize: "var(--t-display)",
        fontWeight: 700,
        lineHeight: 0.95,
        letterSpacing: "-0.03em",
        margin: 0,
        color: "var(--c-primary)",
        textShadow: "0 0 40px var(--c-glow-soft)",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      title="Three taps reveals a choice"
    >
      <DecodeText text={OWNER.name.toUpperCase()} speed={28} />
    </motion.h1>
  );
}

function ScrollIndicator({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          aria-hidden
          style={{
            position: "absolute",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            color: "var(--c-dim)",
            fontSize: "10px",
            letterSpacing: "0.25em",
          }}
        >
          <span>SCROLL</span>
          <motion.span
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: "14px" }}
          >
            ▾
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
