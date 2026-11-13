import { OWNER, PROJECTS, SKILLS, SOCIALS, TIMELINE } from "../config/data";
import type { TrailStepId } from "../trail/trail";
import { FINAL_STEP, TRAIL_STEPS, finaleUnlocked, nextStep, trailCount } from "../trail/trail";

/**
 * The hero's in-page shell: a tiny interpreter over a virtual filesystem
 * generated from the same data the page renders.
 *
 * Everything here is pure — `runShell` and `completeInput` take the input
 * and the shell state and return what to print. Anything that touches the
 * page (scrolling, themes, easter eggs) comes back as an `effect` that the
 * `TerminalPrompt` component runs against a `ShellEnv`.
 */

export type TerminalLineType = "ok" | "warn" | "dim" | "echo";

/** Single rendered line in the terminal scrollback. */
export interface TerminalLine {
  text: string;
  type: TerminalLineType;
}

/** The page-side actions a command may ask for. */
export interface ShellEnv {
  /** Run a command-palette command by id, e.g. "theme.reloaded". */
  runCommand: (id: string) => void;
  scrollTo: (sectionId: string) => void;
  openUrl: (url: string) => void;
  showCv: () => void;
  openPalette: () => void;
  closeShell: () => void;
  /** Record a step of the white-rabbit trail. */
  markTrail: (id: TrailStepId) => void;
  /** Play the end of the trail. */
  finale: () => void;
}

export interface ShellState {
  /** Current directory, always "~" or below it. */
  cwd: string;
  /** Previously entered commands, oldest first. */
  log: string[];
  /** Steps of the white-rabbit trail found so far. */
  trail: string[];
}

export interface ShellResult {
  output: TerminalLine[];
  /** New working directory, when the command changed it. */
  cwd?: string;
  /** Wipe the scrollback instead of printing. */
  clear?: boolean;
  /** Page side effect, run after the output is on screen. */
  effect?: (env: ShellEnv) => void;
}

const ok = (text: string): TerminalLine => ({ text, type: "ok" });
const dim = (text: string): TerminalLine => ({ text, type: "dim" });
const warn = (text: string): TerminalLine => ({ text, type: "warn" });

/* ---------------- Virtual filesystem ---------------- */

export const HOME = "~";
const PROJECTS_DIR = "~/projects";
const DIRS = [HOME, PROJECTS_DIR];

interface FsFile {
  lines: TerminalLine[];
  effect?: (env: ShellEnv) => void;
}

const projectSlug = (codename: string) => codename.toLowerCase();

function social(label: string) {
  return SOCIALS.find((s) => s.label === label);
}

const FILES: Record<string, FsFile> = {
  "~/about.txt": {
    lines: [
      ok(`${OWNER.name} — ${OWNER.role}`),
      dim(""),
      dim(OWNER.bio),
      dim(""),
      ...OWNER.dossierFields.map((f) => dim(`${f.label.padEnd(14)} ${f.value}`)),
    ],
  },
  "~/skills.txt": {
    lines: Object.values(SKILLS).flatMap((group) => [
      ok(group.label.toLowerCase()),
      dim(`  ${group.items.join(" · ")}`),
    ]),
  },
  "~/timeline.txt": {
    lines: TIMELINE.flatMap((entry) => [
      ok(`${entry.period}  ${entry.title}`),
      dim(`  ${entry.place}`),
      dim(`  ${entry.detail}`),
    ]),
  },
  "~/contact.txt": {
    lines: [
      ...SOCIALS.map((s) => dim(`${s.label.toLowerCase().padEnd(10)} ${s.value}`)),
      dim(""),
      dim("try: open email · open github · open linkedin"),
    ],
  },
  "~/.rabbit": {
    lines: [
      ok("follow the white rabbit."),
      dim(""),
      dim("knock, knock. it is hiding in the corner of one of the mission cards."),
      dim("run 'trail' here, or tap the rabbit in the corner, to see how deep this goes."),
    ],
    effect: (env) => env.markTrail("hole"),
  },
  ...Object.fromEntries(
    PROJECTS.map((p): [string, FsFile] => [
      `${PROJECTS_DIR}/${projectSlug(p.codename)}.md`,
      {
        lines: [
          ok(`MISSION ${p.id} // ${p.codename} — ${p.title}`),
          dim(`status   ${p.status}`),
          dim(`stack    ${p.tech.join(", ")}`),
          dim(""),
          dim(p.desc),
          dim(""),
          ...(p.live ? [dim(`live     ${p.live}`)] : []),
          dim(`source   ${p.github}`),
          dim(""),
          dim(`run 'open ${projectSlug(p.codename)}' to jack in.`),
        ],
      },
    ]),
  ),
};

const parentOf = (path: string) => path.slice(0, path.lastIndexOf("/"));
const baseOf = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/** Resolve a typed path against the working directory. Never leaves "~". */
export function resolvePath(cwd: string, arg: string): string {
  const absolute = arg.startsWith("~") || arg.startsWith("/");
  const parts = absolute ? [] : cwd.split("/").slice(1);
  for (const seg of arg.replace(/^~/, "").split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return [HOME, ...parts].join("/");
}

/**
 * Find the file a visitor most likely means. Forgiving on purpose: case
 * does not matter, and neither does a missing leading dot or extension,
 * so `cat Rabbit`, `cat about` and `cat .rabbit` all land.
 */
function findFile(cwd: string, arg: string): string | undefined {
  const path = resolvePath(cwd, arg.toLowerCase());
  if (path in FILES) return path;
  const bare = (name: string) => name.replace(/^\./, "").replace(/\.\w+$/, "");
  const wanted = bare(baseOf(path));
  if (!wanted) return undefined;
  return Object.keys(FILES).find(
    (file) => parentOf(file) === parentOf(path) && bare(baseOf(file)) === wanted,
  );
}

/** Entry names in a directory; directories carry a trailing slash. */
function listDir(dir: string, includeHidden: boolean): string[] {
  const dirs = DIRS.filter((d) => d !== HOME && parentOf(d) === dir).map((d) => `${baseOf(d)}/`);
  const files = Object.keys(FILES)
    .filter((f) => parentOf(f) === dir)
    .map(baseOf);
  return [...dirs, ...files].filter((name) => includeHidden || !name.startsWith("."));
}

/* ---------------- Commands ---------------- */

/** Sections the shell can scroll to, by command name. */
const SECTIONS: Record<string, string> = {
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

const THEME_BY_NAME: Record<string, string> = {
  matrix: "matrix",
  reloaded: "reloaded",
  revolutions: "revolutions",
  green: "matrix",
  blue: "reloaded",
  orange: "revolutions",
  amber: "revolutions",
};

/** Things `open` knows how to open: name → URL. */
function openTargets(): Record<string, string> {
  const targets: Record<string, string> = {};
  for (const p of PROJECTS) targets[projectSlug(p.codename)] = p.live ?? p.github;
  const github = social("GitHub");
  const linkedin = social("LinkedIn");
  const email = social("Email");
  if (github) targets.github = github.href;
  if (linkedin) targets.linkedin = linkedin.href;
  if (email) targets.email = email.href;
  targets.source = PROJECTS[0].github;
  return targets;
}

interface ShellCommand {
  name: string;
  aliases?: string[];
  /** Left column of `help`. */
  usage: string;
  summary: string;
  /** Left out of `help` (still runs, still completes once typed). */
  hidden?: boolean;
  /** What Tab offers for this command's argument. */
  complete?: "path" | "dir" | (() => string[]);
  run: (args: string[], state: ShellState) => ShellResult;
}

const COMMANDS: ShellCommand[] = [
  {
    name: "help",
    usage: "help",
    summary: "show this list",
    run: () => ({ output: helpLines() }),
  },
  {
    name: "ls",
    usage: "ls [dir]",
    summary: "list files (-a shows hidden ones)",
    complete: "dir",
    run: (args, state) => {
      const all = args.some((a) => /^-\w*a/i.test(a));
      const target = args.find((a) => !a.startsWith("-"));
      const path = resolvePath(state.cwd, (target ?? ".").toLowerCase());
      if (path in FILES) return { output: [dim(baseOf(path))] };
      if (!DIRS.includes(path)) {
        return { output: [warn(`ls: ${target}: no such file or directory`)] };
      }
      const output = [dim(listDir(path, all).join("  "))];
      // Say so when something is being left out, rather than hide it twice.
      const hidden = listDir(path, true).length - listDir(path, false).length;
      if (!all && hidden > 0) {
        output.push(dim(`(${hidden} hidden. ls -a shows everything.)`));
      } else if (all && hidden > 0) {
        output.push(dim("(read a file with cat, e.g. cat .rabbit)"));
      }
      return { output };
    },
  },
  {
    name: "cd",
    usage: "cd [dir]",
    summary: "change directory",
    complete: "dir",
    run: (args, state) => {
      const path = resolvePath(state.cwd, (args[0] ?? HOME).toLowerCase());
      if (path in FILES) return { output: [warn(`cd: ${args[0]}: not a directory`)] };
      if (!DIRS.includes(path)) {
        return { output: [warn(`cd: ${args[0]}: no such file or directory`)] };
      }
      return { output: [], cwd: path };
    },
  },
  {
    name: "cat",
    aliases: ["less", "more"],
    usage: "cat <file>",
    summary: "read a file — try: cat about.txt",
    complete: "path",
    run: (args, state) => {
      if (args.length === 0) return { output: [warn("usage: cat <file>")] };
      const output: TerminalLine[] = [];
      const effects: ((env: ShellEnv) => void)[] = [];
      for (const arg of args) {
        const path = resolvePath(state.cwd, arg.toLowerCase());
        const found = findFile(state.cwd, arg);
        const file = found ? FILES[found] : undefined;
        if (file) {
          output.push(...file.lines);
          if (file.effect) effects.push(file.effect);
        } else if (DIRS.includes(path)) {
          output.push(warn(`cat: ${arg}: is a directory`));
        } else {
          output.push(warn(`cat: ${arg}: no such file or directory`));
        }
      }
      return {
        output,
        effect: effects.length ? (env) => effects.forEach((fx) => fx(env)) : undefined,
      };
    },
  },
  {
    name: "open",
    usage: "open <name>",
    summary: "open a project, section or link — try: open quickgigs",
    complete: () => [...Object.keys(openTargets()), "about", "skills", "projects", "timeline", "contact", "cv"],
    run: (args, state) => {
      if (args.length === 0) {
        return {
          output: [
            warn("usage: open <name>"),
            dim(`  ${[...Object.keys(openTargets()), "cv"].join("  ")}`),
          ],
        };
      }
      // Accept `open projects/quickgigs.md` as well as `open quickgigs`.
      const name = baseOf(args[0]).replace(/\.\w+$/, "").toLowerCase();
      if (name === "cv" || name === "resume") return leaveSimulation();
      if (name in SECTIONS) return jumpTo(SECTIONS[name]);
      const url = openTargets()[name];
      // Not a link: if it is a file, opening it means reading it.
      if (!url && findFile(state.cwd, args[0])) return findCommand("cat")!.run([args[0]], state);
      if (!url) return { output: [warn(`open: ${args[0]}: nothing by that name`)] };
      return {
        output: [ok(`> opening ${url.replace(/^mailto:/, "")}…`)],
        effect: (env) => env.openUrl(url),
      };
    },
  },
  {
    name: "theme",
    usage: "theme <name>",
    summary: "matrix | reloaded | revolutions",
    complete: () => ["matrix", "reloaded", "revolutions"],
    run: (args) => {
      const arg = args[0]?.toLowerCase();
      if (!arg) return { output: [warn("usage: theme <matrix|reloaded|revolutions>")] };
      const key = THEME_BY_NAME[arg];
      if (!key) return { output: [warn(`unknown theme: ${arg}`)] };
      return {
        output: [ok(`> theme set to ${key}`)],
        effect: (env) => env.runCommand(`theme.${key}`),
      };
    },
  },
  {
    name: "cv",
    aliases: ["resume", "redpill"],
    usage: "cv",
    summary: "plain, printable CV (alias: redpill)",
    run: leaveSimulation,
  },
  {
    name: "palette",
    usage: "palette",
    summary: "open the command palette",
    run: () => ({ output: [], effect: (env) => env.openPalette() }),
  },
  {
    name: "whoami",
    usage: "whoami",
    summary: "who is on the line?",
    run: () => ({
      output: [
        dim("guest — but you are looking for:"),
        ok(OWNER.name),
        dim(`${OWNER.role} · ${OWNER.location}`),
      ],
    }),
  },
  {
    name: "history",
    usage: "history",
    summary: "commands you have run",
    run: (_args, state) => ({
      output: state.log.map((entry, i) => dim(`${String(i + 1).padStart(3)}  ${entry}`)),
    }),
  },
  {
    name: "clear",
    usage: "clear",
    summary: "wipe the screen (also Ctrl+L)",
    run: () => ({ output: [], clear: true }),
  },
  {
    name: "exit",
    aliases: ["logout", "quit"],
    usage: "exit",
    summary: "close the shell",
    run: () => ({
      output: [dim("Connection to construct closed.")],
      effect: (env) => env.closeShell(),
    }),
  },
  {
    name: "sudo",
    usage: "sudo hire",
    summary: "escalate",
    complete: () => ["hire"],
    run: (args) => {
      if (args[0]?.toLowerCase() === "hire") {
        return {
          output: [
            dim("[sudo] password for guest: ********"),
            ok("access granted."),
            ok("> opening a channel to the operator…"),
          ],
          effect: (env) => env.scrollTo("contact"),
        };
      }
      return {
        output: [
          warn("guest is not in the sudoers file. This incident will be reported to the Agents."),
        ],
      };
    },
  },
  {
    name: "pwd",
    usage: "pwd",
    summary: "print working directory",
    hidden: true,
    run: (_args, state) => ({ output: [dim(state.cwd.replace(HOME, "/home/guest"))] }),
  },
  {
    name: "date",
    usage: "date",
    summary: "current system time",
    hidden: true,
    run: () => ({ output: [dim(new Date().toString())] }),
  },
  {
    name: "echo",
    usage: "echo <text>",
    summary: "print text",
    hidden: true,
    run: (args) => ({ output: [dim(args.join(" "))] }),
  },
  {
    name: "rm",
    usage: "rm",
    summary: "",
    hidden: true,
    run: () => ({ output: [warn("rm: cannot remove: the Matrix has you.")] }),
  },
  {
    name: "trail",
    usage: "trail",
    summary: "",
    hidden: true,
    run: (_args, state) => ({ output: trailLines(state.trail) }),
  },
  {
    // "there is no spoon" — and the ways people actually type it.
    name: "there",
    aliases: ["spoon", "no", "theres", "there's"],
    usage: "there is no spoon",
    summary: "",
    hidden: true,
    run: (args, state) => {
      const rest = args.join(" ").toLowerCase().replace(/[^a-z ]/g, "").trim();
      if (!["", "spoon", "no spoon", "is no spoon"].includes(rest)) {
        return {
          output: [warn("that is not what the boy said."), dim("he said: there is no spoon.")],
        };
      }
      if (!finaleUnlocked(state.trail)) {
        const missing = TRAIL_STEPS.filter(
          (s) => s.id !== FINAL_STEP && !state.trail.includes(s.id),
        );
        return {
          output: [
            dim("the spoon does not bend. not yet."),
            dim(`you have ${trailCount(state.trail)}. first:`),
            ...missing.map((s) => dim(`  - ${s.clue}`)),
          ],
        };
      }
      return {
        output: [
          ok("then you will see that it is not the spoon that bends."),
          ok("it is only yourself."),
        ],
        effect: (env) => {
          env.markTrail(FINAL_STEP);
          env.finale();
        },
      };
    },
  },
  {
    name: "pills",
    aliases: ["pill", "bluepill"],
    usage: "pills",
    summary: "",
    hidden: true,
    run: () => ({ output: [ok("> make your choice…")], effect: (env) => env.runCommand("egg.pills") }),
  },
  {
    name: "dejavu",
    aliases: ["glitch", "cat"],
    usage: "dejavu",
    summary: "",
    hidden: true,
    run: () => ({
      output: [dim("a déjà vu is usually a glitch in the Matrix.")],
      effect: (env) => env.runCommand("egg.dejavu"),
    }),
  },
  {
    name: "rabbit",
    aliases: ["whiterabbit"],
    usage: "rabbit",
    summary: "",
    hidden: true,
    run: () => ({ output: [dim("you do not call the rabbit. you follow it. try: ls -a")] }),
  },
  {
    name: "neo",
    aliases: ["wakeup"],
    usage: "neo",
    summary: "",
    hidden: true,
    run: () => ({
      output: [ok("Wake up, Neo…"), ok("The Matrix has you…"), ok("Follow the white rabbit.")],
    }),
  },
  {
    name: "smith",
    aliases: ["agent"],
    usage: "smith",
    summary: "",
    hidden: true,
    run: () => ({ output: [warn("Mr. Anderson. We have been expecting you.")] }),
  },
];

/** `trail` — what has been found, and a pointer to the next thing. */
function trailLines(found: string[]): TerminalLine[] {
  const next = nextStep(found);
  return [
    ok(`follow the white rabbit — ${trailCount(found)}`),
    ...TRAIL_STEPS.map((s) =>
      found.includes(s.id) ? ok(`  [x] ${s.label}`) : dim("  [ ] ? ? ?"),
    ),
    dim(""),
    ...(next
      ? [dim(`"${next.quote}"`), dim(`next: ${next.clue}`)]
      : [dim("there is nothing left to find. you are the one.")]),
  ];
}

function findCommand(name: string): ShellCommand | undefined {
  return COMMANDS.find((c) => c.name === name || c.aliases?.includes(name));
}

function jumpTo(sectionId: string): ShellResult {
  return {
    output: [ok(`> jumping to #${sectionId}…`)],
    effect: (env) => env.scrollTo(sectionId),
  };
}

function leaveSimulation(): ShellResult {
  return {
    output: [ok("> leaving the simulation…")],
    effect: (env) => env.showCv(),
  };
}

function helpLines(): TerminalLine[] {
  const row = (usage: string, summary: string) => dim(`  ${usage.padEnd(15)} ${summary}`);
  return [
    ok("available commands:"),
    ...COMMANDS.filter((c) => !c.hidden).map((c) => row(c.usage, c.summary)),
    row("<section>", "about | skills | projects | timeline | contact"),
    dim(""),
    dim("tab completes · ↑/↓ recalls · not everything is listed."),
  ];
}

/** Run one line of input. Never throws; unknown input prints an error. */
export function runShell(raw: string, state: ShellState): ShellResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { output: [] };

  const [first, ...args] = trimmed.split(/\s+/);
  const name = first.toLowerCase();

  const command = findCommand(name);
  if (command) return command.run(args, state);

  if (name in SECTIONS) return jumpTo(SECTIONS[name]);

  // A bare file name reads the file: `.rabbit` or `about.txt` on its own.
  if (args.length === 0 && /[./]/.test(first) && findFile(state.cwd, first)) {
    return findCommand("cat")!.run([first], state);
  }

  // A bare theme name works as shorthand for `theme <name>`.
  if (name in THEME_BY_NAME) return findCommand("theme")!.run([name], state);

  const guess = closestCommand(name);
  return {
    output: [
      warn(`command not found: ${first}`),
      dim(guess ? `did you mean '${guess}'?` : "type 'help' for available commands."),
    ],
  };
}

/** Nearest visible command within two edits, for "did you mean". */
function closestCommand(name: string): string | undefined {
  let best: string | undefined;
  let bestDistance = 3;
  for (const candidate of [...COMMANDS.filter((c) => !c.hidden).map((c) => c.name), ...Object.keys(SECTIONS)]) {
    const d = editDistance(name, candidate);
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}

function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/* ---------------- Tab completion ---------------- */

export interface Completion {
  /** The input after completing as far as is unambiguous. */
  value: string;
  /** Every candidate, when there is more than one. */
  options: string[];
}

function pathCandidates(cwd: string, fragment: string, dirsOnly: boolean): string[] {
  const slash = fragment.lastIndexOf("/");
  const base = fragment.slice(0, slash + 1);
  const partial = fragment.slice(slash + 1);
  const dir = resolvePath(cwd, base || ".");
  if (!DIRS.includes(dir)) return [];
  return listDir(dir, partial.startsWith("."))
    .filter((name) => !dirsOnly || name.endsWith("/"))
    .map((name) => base + name);
}

/** Complete the last word of `input`, shell-style. */
export function completeInput(input: string, cwd: string): Completion {
  const tokens = input.trimStart().split(/\s+/);
  const fragment = tokens[tokens.length - 1];

  let candidates: string[];
  if (tokens.length === 1) {
    candidates = [
      ...COMMANDS.filter((c) => !c.hidden).map((c) => c.name),
      "about",
      "skills",
      "projects",
      "timeline",
      "contact",
    ];
  } else {
    const spec = findCommand(tokens[0].toLowerCase())?.complete;
    if (!spec) candidates = [];
    else if (typeof spec === "function") candidates = spec();
    else candidates = pathCandidates(cwd, fragment, spec === "dir");
  }

  const matches = candidates.filter((c) => c.startsWith(fragment));
  if (matches.length === 0) return { value: input, options: [] };

  const stem = input.slice(0, input.length - fragment.length);
  if (matches.length === 1) {
    const only = matches[0];
    return { value: stem + only + (only.endsWith("/") ? "" : " "), options: [] };
  }

  let common = matches[0];
  for (const m of matches) {
    while (!m.startsWith(common)) common = common.slice(0, -1);
  }
  return { value: stem + common, options: matches };
}
