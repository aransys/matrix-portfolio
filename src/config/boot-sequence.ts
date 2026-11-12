import type { TerminalLine } from "../components/TerminalPrompt";

/**
 * Boot log shown as the opening scrollback of the hero's shell — what the
 * visitor finds already on screen when they drop into the terminal.
 */
export const BOOT_LOG: TerminalLine[] = [
  { text: "RANSYS SYSTEMS v2.0.26", type: "dim" },
  { text: "Initialising kernel...", type: "dim" },
  { text: "[  OK  ] Mounted /dev/portfolio", type: "ok" },
  { text: "[  OK  ] Started network daemon", type: "ok" },
  { text: "[  OK  ] Loaded skills.module", type: "ok" },
  { text: "[ WARN ] Matrix rain shader compiled", type: "warn" },
  { text: "[  OK  ] Connected to the construct", type: "ok" },
  { text: "", type: "dim" },
  { text: "Operator: Tank", type: "dim" },
  { text: '"We got a signal. Main line."', type: "dim" },
  { text: "", type: "dim" },
  { text: "type 'help' for commands, or try 'ls'. tab completes.", type: "dim" },
];
