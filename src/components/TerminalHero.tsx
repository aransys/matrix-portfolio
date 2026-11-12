import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { useCallback, useState } from "react";
import { BOOT_LOG } from "../config/boot-sequence";
import { NAV_LINKS, OWNER } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { useTapPattern } from "../hooks/useTapPattern";
import { GlitchText } from "./ui/GlitchText";
import type { CommandContext, EggKey } from "../config/commands";
import { HeroName } from "./HeroName";
import { TerminalPrompt } from "./TerminalPrompt";
import type { TerminalLine } from "./TerminalPrompt";

export interface TerminalHeroProps {
  theme: ThemeKey;
  /** The palette's action surface, shared with the shell. */
  commandCtx: Omit<CommandContext, "closePalette">;
  onOpenPalette: () => void;
  /** Switch to the plain, printable CV view. */
  onShowCv: () => void;
}

/**
 * Cinematic hero.
 *
 * Everything — name, role, navigation, palette and shell buttons — is on
 * the page from the first paint. On the first visit of a session the name
 * resolves out of falling code (see `HeroName`); nothing else waits on it.
 *
 * The optional bottom drawer reveals an interactive shell on demand, with
 * the boot log as its opening scrollback.
 */
export function TerminalHero({ theme, commandCtx, onOpenPalette, onShowCv }: TerminalHeroProps) {
  const [scrollback, setScrollback] = useState<TerminalLine[]>(BOOT_LOG);
  const [shellOpen, setShellOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  // Parallax: as the user scrolls, the hero gently lifts and fades
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 600], [1, 0.96]);

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
        <RevealedHero
          theme={theme}
          commandCtx={commandCtx}
          onOpenPalette={onOpenPalette}
          onShowCv={onShowCv}
          shellOpen={shellOpen}
          setShellOpen={setShellOpen}
          scrollback={scrollback}
          appendLines={(newLines) => setScrollback((prev) => [...prev, ...newLines])}
          clearScrollback={() => setScrollback([])}
        />
      </motion.div>

      <ScrollIndicator />
    </section>
  );
}

/* ---------------- Hero content ---------------- */

interface RevealedHeroProps {
  theme: ThemeKey;
  /** The palette's action surface, shared with the shell. */
  commandCtx: Omit<CommandContext, "closePalette">;
  onOpenPalette: () => void;
  onShowCv: () => void;
  shellOpen: boolean;
  setShellOpen: (open: boolean) => void;
  scrollback: TerminalLine[];
  appendLines: (lines: TerminalLine[]) => void;
  clearScrollback: () => void;
}

function RevealedHero({
  theme,
  commandCtx,
  onOpenPalette,
  onShowCv,
  shellOpen,
  setShellOpen,
  scrollback,
  appendLines,
  clearScrollback,
}: RevealedHeroProps) {
  const [resolved, setResolved] = useState(false);
  const onResolved = useCallback(() => setResolved(true), []);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(20px, 3vh, 36px)",
        textAlign: "center",
      }}
    >
      {/* Dark pool behind the copy so the rain never fights the text */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-18% -12%",
          zIndex: -1,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 42%, transparent 70%)",
        }}
      />

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
            animation: resolved ? "none" : "cursorBlink 0.5s step-end infinite",
          }}
        />
        <span aria-live="off">
          {resolved ? "Signal Acquired · Online" : "Tracing Signal…"}
        </span>
      </motion.div>

      <HeroName
        text={OWNER.name.toUpperCase()}
        theme={theme}
        onResolved={onResolved}
        onClick={onTriplePress}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
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
        transition={{ delay: 0.25, duration: 0.5 }}
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
        transition={{ delay: 0.35, duration: 0.5 }}
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

        <button type="button" onClick={onShowCv} className="hero-redpill">
          <span aria-hidden className="hero-redpill__pill" />
          red pill: plain CV
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
                commandCtx={commandCtx}
                onOpenPalette={onOpenPalette}
                onClose={() => setShellOpen(false)}
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

function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      transition={{ delay: 1.2, duration: 0.6 }}
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
  );
}
