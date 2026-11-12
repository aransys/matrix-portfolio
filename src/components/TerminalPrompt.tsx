import type { CSSProperties, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { CommandContext } from "../config/commands";
import { buildCommands } from "../config/commands";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import type { ShellEnv, TerminalLine, TerminalLineType } from "../shell/shell";
import { HOME, completeInput, runShell } from "../shell/shell";
import { WARN_ACCENT } from "../styles/tokens";

export type { TerminalLine, TerminalLineType } from "../shell/shell";

export interface TerminalPromptProps {
  theme: ThemeKey;
  /** The palette's action surface — themes and easter eggs run through it. */
  commandCtx: Omit<CommandContext, "closePalette">;
  onOpenPalette: () => void;
  /** Close the shell drawer (`exit`). */
  onClose: () => void;
  /** Already-rendered scrollback (boot output + previous command output). */
  history: TerminalLine[];
  /** Append more lines to the scrollback. */
  appendLines: (lines: TerminalLine[]) => void;
  /** Wipe the scrollback (used by `clear`). */
  clearScrollback: () => void;
}

/** Shell prompt for a working directory, e.g. "ransys@dev:~/projects$ ". */
const promptFor = (cwd: string) => `ransys@dev:${cwd}$ `;

/** Maximum number of past commands kept for ↑/↓ history navigation. */
const MAX_HISTORY = 50;

/** Pause before effects that take the visitor away, so the reply is readable. */
const LEAVE_DELAY_MS = 500;

function getLineColor(type: TerminalLineType, t: (typeof THEMES)[ThemeKey]): string {
  switch (type) {
    case "ok":
      return t.primary;
    case "warn":
      return WARN_ACCENT;
    case "echo":
      return t.secondary;
    case "dim":
    default:
      return t.dim;
  }
}

const lineStyle = (type: TerminalLineType, t: (typeof THEMES)[ThemeKey]): CSSProperties => ({
  color: getLineColor(type, t),
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: "13px",
});

export function TerminalPrompt({
  theme,
  commandCtx,
  onOpenPalette,
  onClose,
  history,
  appendLines,
  clearScrollback,
}: TerminalPromptProps) {
  const t = THEMES[theme];
  const [value, setValue] = useState("");
  /** Past commands, oldest first. ↑ walks backwards from the end. */
  const [commandLog, setCommandLog] = useState<string[]>([]);
  /** -1 = editing a fresh line; 0..n-1 = pointing at a past entry. */
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cwd, setCwd] = useState(HOME);
  const prompt = promptFor(cwd);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-focus on mount and re-focus whenever the user clicks anywhere on the
  // terminal body — matches the "click to type" feel of a real shell.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep the cursor in view as new output is appended.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [history.length]);

  const env: ShellEnv = {
    runCommand: (id) =>
      buildCommands({ ...commandCtx, closePalette: () => {} })
        .find((c) => c.id === id)
        ?.run(),
    scrollTo: (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
    openUrl: (url) => {
      if (url.startsWith("mailto:")) window.location.href = url;
      else window.open(url, "_blank", "noopener");
    },
    showCv: () => window.setTimeout(commandCtx.showCv, LEAVE_DELAY_MS),
    openPalette: onOpenPalette,
    closeShell: () => window.setTimeout(onClose, LEAVE_DELAY_MS),
  };

  const submit = (raw: string) => {
    const result = runShell(raw, { cwd, log: commandLog });

    if (result.clear) {
      clearScrollback();
    } else {
      // Echo the entered command alongside the prompt so the scrollback
      // reads like a real terminal session.
      appendLines([{ text: `${prompt}${raw}`, type: "echo" }, ...result.output]);
    }
    if (result.cwd) setCwd(result.cwd);

    // Run the side effect on the next frame so the output is on screen (and
    // laid out) before anything scrolls or repaints.
    if (result.effect) {
      const effect = result.effect;
      requestAnimationFrame(() => effect(env));
    }

    if (raw.trim() !== "") {
      setCommandLog((prev) => {
        const next = [...prev, raw];
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
      });
    }
    setHistoryIndex(-1);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit(value);
      return;
    }
    if (e.key === "Tab" && !e.shiftKey && value.trim() !== "") {
      // Only when there is something to complete — on an empty line Tab
      // still moves keyboard focus out of the shell.
      e.preventDefault();
      const completion = completeInput(value, cwd);
      if (completion.options.length > 1) {
        appendLines([
          { text: `${prompt}${value}`, type: "echo" },
          { text: completion.options.join("  "), type: "dim" },
        ]);
      }
      setValue(completion.value);
      setHistoryIndex(-1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandLog.length === 0) return;
      const nextIdx =
        historyIndex === -1 ? commandLog.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setValue(commandLog[nextIdx]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandLog.length) {
        setHistoryIndex(-1);
        setValue("");
      } else {
        setHistoryIndex(nextIdx);
        setValue(commandLog[nextIdx]);
      }
      return;
    }
    if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      // Ctrl+L / Cmd+L mirrors the typical shell shortcut for clearing.
      e.preventDefault();
      clearScrollback();
      setValue("");
      setHistoryIndex(-1);
      return;
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{ cursor: "text" }}
    >
      {history.map((line, i) => (
        <div key={i} style={lineStyle(line.type, t)}>
          {line.text || "\u00A0"}
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
        <span style={{ color: t.dim, fontSize: "13px", whiteSpace: "pre" }}>
          {prompt}
        </span>
        <span
          style={{
            color: t.primary,
            fontSize: "13px",
            whiteSpace: "pre",
          }}
        >
          {value}
        </span>
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "8px",
            height: "14px",
            background: t.primary,
            marginLeft: "2px",
            verticalAlign: "text-bottom",
            animation: "cursorBlink 0.7s step-end infinite",
          }}
        />
        <input
          ref={inputRef}
          aria-label="Terminal command input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setHistoryIndex(-1);
          }}
          onKeyDown={onKeyDown}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          // Visually hidden but still keyboard-reachable & screen-reader-labelled.
          // The visible "prompt + value + cursor" above is the rendered version.
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            width: "1px",
            height: "1px",
            opacity: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            color: "transparent",
          }}
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}
