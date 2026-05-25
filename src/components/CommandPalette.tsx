import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Command, CommandContext } from "../config/commands";
import { buildCommands } from "../config/commands";

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  ctx: Omit<CommandContext, "closePalette">;
}

const GROUP_LABEL: Record<Command["group"], string> = {
  navigate: "Navigate",
  theme: "Themes",
  "easter-egg": "Easter eggs",
  system: "System",
};

const GROUP_ORDER: Command["group"][] = [
  "navigate",
  "theme",
  "easter-egg",
  "system",
];

/**
 * Cmd+K command palette.
 *
 * Keyboard-first design: arrow keys move the highlight, enter runs the
 * highlighted action, escape closes. Touch users can scroll the list and
 * tap. The whole component locks scroll behind it via `overflow: hidden`
 * on body while open.
 */
export function CommandPalette({ open, onClose, ctx }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build the catalogue once per ctx — buildCommands captures closures so
  // it shouldn't be rebuilt on every render.
  const commands = useMemo(
    () => buildCommands({ ...ctx, closePalette: onClose }),
    [ctx, onClose],
  );

  /** Filtered, ordered list. Empty query shows everything except hidden. */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.filter((c) => !c.hidden);
    const tokens = q.split(/\s+/);
    return commands
      .filter((c) => !c.hidden || matchesAll(c, tokens))
      .filter((c) => matchesAll(c, tokens))
      .sort((a, b) => scoreCommand(b, tokens) - scoreCommand(a, tokens));
  }, [commands, query]);

  // Reset highlight when the filter changes. Single, idempotent setState —
  // not the cascading pattern the rule warns about.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIdx(0);
  }, [query]);

  // Focus the input every time we open; lock body scroll while open
  useEffect(() => {
    if (!open) return;
    // Reset the input + highlight whenever the palette opens. The setStates
    // run once per open transition — not the cascading pattern the lint
    // rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery("");
    setActiveIdx(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Keep the highlighted row scrolled into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(
      `[data-row-index="${activeIdx}"]`,
    );
    row?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[activeIdx];
        if (cmd) cmd.run();
        return;
      }
    },
    [filtered, activeIdx, onClose],
  );

  // Build group → rows map so we can render section headings
  const grouped = useMemo(() => {
    const map = new Map<Command["group"], (Command & { run: () => void; absIdx: number })[]>();
    filtered.forEach((cmd, absIdx) => {
      const list = map.get(cmd.group) ?? [];
      list.push({ ...cmd, absIdx });
      map.set(cmd.group, list);
    });
    return map;
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          onKeyDown={onKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(10px) saturate(140%)",
            WebkitBackdropFilter: "blur(10px) saturate(140%)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "clamp(48px, 12vh, 120px) 16px 16px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass glass--raised"
            style={{
              width: "100%",
              maxWidth: "640px",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--c-border-strong)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "min(640px, 80vh)",
              boxShadow:
                "0 32px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px var(--c-border-strong), 0 0 60px var(--c-glow-soft)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 18px",
                borderBottom: "1px solid var(--c-border)",
                background: "rgba(0,0,0,0.4)",
              }}
            >
              <span
                aria-hidden
                style={{
                  color: "var(--c-dim)",
                  fontSize: "16px",
                  fontFamily: "var(--font-display)",
                }}
              >
                ⌘
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or run a command…"
                aria-label="Search commands"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--c-primary)",
                  fontSize: "var(--t-md)",
                  fontFamily: "inherit",
                }}
              />
              <kbd
                style={{
                  fontSize: "10px",
                  padding: "3px 8px",
                  borderRadius: "var(--r-sm)",
                  background: "rgba(0,0,0,0.45)",
                  border: "1px solid var(--c-border)",
                  color: "var(--c-dim)",
                  letterSpacing: "0.1em",
                }}
              >
                ESC
              </kbd>
            </div>

            <div
              ref={listRef}
              role="listbox"
              aria-label="Commands"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px 6px",
              }}
            >
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "var(--c-dim)",
                    fontSize: "var(--t-sm)",
                  }}
                >
                  No match. Try <code>pill</code>, <code>glitch</code>, or{" "}
                  <code>theme</code>.
                </div>
              )}

              {GROUP_ORDER.map((group) => {
                const rows = grouped.get(group);
                if (!rows || rows.length === 0) return null;
                return (
                  <div key={group} style={{ marginBottom: "8px" }}>
                    <div
                      className="tag"
                      style={{
                        padding: "10px 14px 6px",
                        color: "var(--c-dim)",
                        fontSize: "10px",
                        letterSpacing: "0.22em",
                      }}
                    >
                      {GROUP_LABEL[group]}
                    </div>
                    {rows.map((cmd) => {
                      const isActive = cmd.absIdx === activeIdx;
                      return (
                        <button
                          key={cmd.id}
                          data-row-index={cmd.absIdx}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIdx(cmd.absIdx)}
                          onClick={() => cmd.run()}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "28px 1fr auto",
                            alignItems: "center",
                            gap: "12px",
                            width: "100%",
                            padding: "10px 14px",
                            background: isActive
                              ? "var(--c-glow-soft)"
                              : "transparent",
                            border: "none",
                            borderRadius: "var(--r-sm)",
                            color: "var(--c-primary)",
                            fontFamily: "inherit",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "background 0.12s ease",
                          }}
                        >
                          <span
                            aria-hidden
                            style={{
                              fontSize: "16px",
                              color: isActive
                                ? "var(--c-primary)"
                                : "var(--c-secondary)",
                              textAlign: "center",
                            }}
                          >
                            {cmd.icon}
                          </span>
                          <span
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "var(--t-sm)",
                                color: isActive
                                  ? "var(--c-primary)"
                                  : "var(--c-secondary)",
                                fontWeight: 500,
                              }}
                            >
                              {cmd.title}
                            </span>
                            {cmd.subtitle && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--c-dim)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {cmd.subtitle}
                              </span>
                            )}
                          </span>
                          {cmd.shortcut && (
                            <kbd
                              style={{
                                fontSize: "10px",
                                padding: "2px 8px",
                                borderRadius: "var(--r-sm)",
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid var(--c-border)",
                                color: "var(--c-dim)",
                                letterSpacing: "0.08em",
                              }}
                            >
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid var(--c-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "10px",
                color: "var(--c-dim)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                background: "rgba(0,0,0,0.35)",
              }}
            >
              <span>
                <KbdInline>↑</KbdInline> <KbdInline>↓</KbdInline> navigate ·{" "}
                <KbdInline>⏎</KbdInline> run
              </span>
              <span>{filtered.length} commands</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function KbdInline({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        fontSize: "10px",
        padding: "1px 6px",
        marginRight: "2px",
        borderRadius: "3px",
        background: "rgba(0,0,0,0.4)",
        border: "1px solid var(--c-border)",
        color: "var(--c-secondary)",
      }}
    >
      {children}
    </kbd>
  );
}

/* ---------------- search scoring ---------------- */

function fields(cmd: Command): string {
  return [cmd.title, cmd.subtitle ?? "", ...(cmd.keywords ?? [])]
    .join(" ")
    .toLowerCase();
}

function matchesAll(cmd: Command, tokens: string[]): boolean {
  const haystack = fields(cmd);
  return tokens.every((tok) => haystack.includes(tok));
}

function scoreCommand(cmd: Command, tokens: string[]): number {
  const haystack = fields(cmd);
  let score = 0;
  for (const tok of tokens) {
    if (cmd.title.toLowerCase().startsWith(tok)) score += 12;
    else if (cmd.title.toLowerCase().includes(tok)) score += 8;
    if (cmd.keywords?.some((k) => k.toLowerCase().startsWith(tok))) score += 5;
    if (haystack.includes(tok)) score += 1;
  }
  return score;
}
