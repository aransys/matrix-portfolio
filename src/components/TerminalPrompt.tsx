import type { CSSProperties, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { WARN_ACCENT } from "../styles/tokens";

/** Single rendered line in the terminal scrollback. */
export type TerminalLineType = "ok" | "warn" | "dim" | "echo";

export interface TerminalLine {
  text: string;
  type: TerminalLineType;
}

export interface TerminalPromptProps {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  /** Already-rendered scrollback (boot output + previous command output). */
  history: TerminalLine[];
  /** Append more lines to the scrollback. */
  appendLines: (lines: TerminalLine[]) => void;
  /** Wipe the scrollback (used by `clear`). */
  clearScrollback: () => void;
}

/** Shell prompt prefix — kept consistent with the title bar's "ransys.dev — zsh". */
const PROMPT_PREFIX = "ransys@dev:~$ ";

/** Maximum number of past commands kept for ↑/↓ history navigation. */
const MAX_HISTORY = 50;

/** Sections we know how to scroll to, plus their command aliases. */
const SECTION_BY_COMMAND: Record<string, string> = {
  about: "about",
  skills: "skills",
  projects: "projects",
  missions: "projects",
  timeline: "timeline",
  contact: "contact",
  transmission: "contact",
  hero: "hero",
  top: "hero",
};

/** Theme aliases — supports both canonical keys and a few thematic nicknames. */
const THEME_BY_NAME: Record<string, ThemeKey> = {
  matrix: "matrix",
  reloaded: "reloaded",
  revolutions: "revolutions",
  green: "matrix",
  blue: "reloaded",
  orange: "revolutions",
};

interface CommandResult {
  output: TerminalLine[];
  /** Side-effect run after the output lines are committed (scroll, theme, …). */
  effect?: () => void;
}

/** Static help table — kept as plain strings so each line gets its own row. */
const HELP_LINES: TerminalLine[] = [
  { text: "available commands:", type: "ok" },
  { text: "  help              show this list", type: "dim" },
  { text: "  about             jump to about section", type: "dim" },
  { text: "  skills            jump to skills section", type: "dim" },
  { text: "  projects          jump to projects (alias: missions)", type: "dim" },
  { text: "  timeline          jump to timeline", type: "dim" },
  { text: "  contact           jump to contact (alias: transmission)", type: "dim" },
  { text: "  ls                list sections", type: "dim" },
  { text: "  whoami            who am I?", type: "dim" },
  { text: "  theme <name>      matrix | reloaded | revolutions", type: "dim" },
  { text: "  date              current system time", type: "dim" },
  { text: "  echo <text>       print text", type: "dim" },
  { text: "  clear             wipe the scrollback", type: "dim" },
];

function runCommand(
  raw: string,
  setTheme: (key: ThemeKey) => void,
  clearScrollback: () => void,
): CommandResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { output: [] };

  const [cmd, ...args] = trimmed.split(/\s+/);
  const name = cmd.toLowerCase();

  // Section jumps — short-circuit the big switch since they all behave the same.
  if (name in SECTION_BY_COMMAND) {
    const id = SECTION_BY_COMMAND[name];
    return {
      output: [{ text: `> jumping to #${id}…`, type: "ok" }],
      effect: () => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      },
    };
  }

  switch (name) {
    case "help":
      return { output: HELP_LINES };

    case "ls":
      return {
        output: [{ text: "about/  skills/  projects/  timeline/  contact/", type: "dim" }],
      };

    case "whoami":
      return {
        output: [
          { text: "Aurimas Ransys", type: "ok" },
          { text: "Full Stack Developer · CS @ Leeds Beckett · Kaunas → Leeds", type: "dim" },
        ],
      };

    case "theme": {
      const arg = args[0]?.toLowerCase();
      if (!arg) {
        return {
          output: [
            { text: "usage: theme <matrix|reloaded|revolutions>", type: "warn" },
          ],
        };
      }
      const key = THEME_BY_NAME[arg];
      if (!key) {
        return {
          output: [{ text: `unknown theme: ${arg}`, type: "warn" }],
        };
      }
      return {
        output: [{ text: `> theme set to ${key}`, type: "ok" }],
        effect: () => setTheme(key),
      };
    }

    case "date":
      return { output: [{ text: new Date().toString(), type: "dim" }] };

    case "echo":
      return { output: [{ text: args.join(" "), type: "dim" }] };

    case "clear":
      return { output: [], effect: () => clearScrollback() };

    case "sudo":
      return {
        output: [
          {
            text: `[sudo] permission denied: ${args.join(" ") || "(no command)"}`,
            type: "warn",
          },
        ],
      };

    case "exit":
      return {
        output: [{ text: "Connection to construct closed.", type: "dim" }],
      };

    case "neo":
    case "matrix":
      return { output: [{ text: "Wake up, Neo…", type: "ok" }] };

    default:
      return {
        output: [
          {
            text: `command not found: ${cmd}. type 'help' for available commands.`,
            type: "warn",
          },
        ],
      };
  }
}

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
  setTheme,
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

  const submit = (raw: string) => {
    // Echo the entered command alongside the prompt so the scrollback reads
    // like a real terminal session.
    const echoLine: TerminalLine = {
      text: `${PROMPT_PREFIX}${raw}`,
      type: "echo",
    };

    const result = runCommand(raw, setTheme, clearScrollback);

    // `clear` is the one command that wipes scrollback — in that case we don't
    // want to immediately reintroduce the just-typed echo line.
    const isClear = raw.trim().toLowerCase() === "clear";
    if (!isClear) {
      appendLines([echoLine, ...result.output]);
    }

    // Side-effect runs after output is committed so any DOM lookups (e.g.
    // scrollIntoView) see the latest layout.
    if (result.effect) {
      // requestAnimationFrame keeps theme switches feeling instant while still
      // giving React a chance to flush the appended lines first.
      requestAnimationFrame(() => result.effect?.());
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
          {PROMPT_PREFIX}
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
