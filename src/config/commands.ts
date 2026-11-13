import type { ThemeKey } from "./themes";

/** A discoverable action surfaced by the command palette. */
export interface Command {
  id: string;
  title: string;
  /** Lower-priority hint shown to the right of the title */
  subtitle?: string;
  /** Search-friendly keywords beyond the title text */
  keywords?: string[];
  /** Category — drives the section heading and the icon glyph */
  group: "navigate" | "theme" | "easter-egg" | "system";
  /** Icon glyph displayed left of the title — kept to single chars */
  icon: string;
  /** Whether to hide this row from the default list (still searchable) */
  hidden?: boolean;
  /** Optional keyboard hint to display on the right */
  shortcut?: string;
}

export type EggKey = "pills" | "operatorMode" | "dejaVu" | "finale";

export interface CommandContext {
  setTheme: (key: ThemeKey) => void;
  triggerEgg: (key: EggKey) => void;
  toggleEgg: (key: EggKey) => void;
  showMessage: (msg: string, durationMs?: number) => void;
  /** Switch to the plain, printable CV view. */
  showCv: () => void;
  closePalette: () => void;
}

/**
 * The full command catalogue. The palette renders these; phrases and the
 * Konami code map onto the same actions so every trigger lands in the
 * same place.
 */
export function buildCommands(ctx: CommandContext): (Command & {
  run: () => void;
})[] {
  return [
    // Navigation
    {
      id: "nav.hero",
      title: "Go to Hero",
      subtitle: "Top of the page",
      group: "navigate",
      icon: "▲",
      keywords: ["top", "home", "start"],
      run: () => {
        scrollTo("hero");
        ctx.closePalette();
      },
    },
    {
      id: "nav.about",
      title: "Go to About",
      subtitle: "The operator dossier",
      group: "navigate",
      icon: "①",
      keywords: ["dossier", "bio", "who"],
      run: () => {
        scrollTo("about");
        ctx.closePalette();
      },
    },
    {
      id: "nav.skills",
      title: "Go to Skills",
      subtitle: "Stack map",
      group: "navigate",
      icon: "②",
      keywords: ["tech", "stack", "tools"],
      run: () => {
        scrollTo("skills");
        ctx.closePalette();
      },
    },
    {
      id: "nav.projects",
      title: "Go to Projects",
      subtitle: "Mission log",
      group: "navigate",
      icon: "③",
      keywords: ["missions", "work", "portfolio"],
      run: () => {
        scrollTo("projects");
        ctx.closePalette();
      },
    },
    {
      id: "nav.timeline",
      title: "Go to Timeline",
      subtitle: "Trajectory",
      group: "navigate",
      icon: "④",
      keywords: ["history", "career", "path"],
      run: () => {
        scrollTo("timeline");
        ctx.closePalette();
      },
    },
    {
      id: "nav.contact",
      title: "Go to Contact",
      subtitle: "Send a signal",
      group: "navigate",
      icon: "⑤",
      keywords: ["email", "transmission", "message", "hire"],
      run: () => {
        scrollTo("contact");
        ctx.closePalette();
      },
    },

    // Themes
    {
      id: "theme.matrix",
      title: "Theme · Matrix",
      subtitle: "1999 · Source — classic green",
      group: "theme",
      icon: "◉",
      keywords: ["green", "classic", "first"],
      run: () => {
        ctx.setTheme("matrix");
        ctx.showMessage("Theme set to MATRIX");
        ctx.closePalette();
      },
    },
    {
      id: "theme.reloaded",
      title: "Theme · Reloaded",
      subtitle: "2003 · Architect — cold blue",
      group: "theme",
      icon: "◉",
      keywords: ["blue", "architect", "white"],
      run: () => {
        ctx.setTheme("reloaded");
        ctx.showMessage("Theme set to RELOADED");
        ctx.closePalette();
      },
    },
    {
      id: "theme.revolutions",
      title: "Theme · Revolutions",
      subtitle: "2003 · Machine City — sodium amber",
      group: "theme",
      icon: "◉",
      keywords: ["orange", "amber", "machine"],
      run: () => {
        ctx.setTheme("revolutions");
        ctx.showMessage("Theme set to REVOLUTIONS");
        ctx.closePalette();
      },
    },

    // The trail. Only its way in is listed; the rest has to be found.
    // The hidden rows still answer to a search for their name.
    {
      id: "egg.rabbit",
      title: "Follow the white rabbit",
      subtitle: "There is more here than the menu shows",
      group: "easter-egg",
      icon: "◐",
      keywords: ["rabbit", "alice", "secret", "easter", "egg", "trail", "hidden"],
      run: () => {
        ctx.showMessage("The rabbit went down the shell. Drop in and list everything: ls -a", 4200);
        ctx.closePalette();
      },
    },
    {
      id: "egg.pills",
      title: "Take a pill",
      subtitle: "Red wakes you up. Blue keeps the dream.",
      group: "easter-egg",
      icon: "◐",
      hidden: true,
      keywords: ["red", "blue", "morpheus", "choice", "pills"],
      run: () => {
        ctx.triggerEgg("pills");
        ctx.closePalette();
      },
    },
    {
      id: "egg.dejavu",
      title: "Déjà vu",
      subtitle: "A glitch in the Matrix",
      group: "easter-egg",
      icon: "⚡",
      hidden: true,
      keywords: ["deja", "dejavu", "cat", "glitch"],
      run: () => {
        ctx.triggerEgg("dejaVu");
        ctx.closePalette();
      },
    },
    {
      id: "egg.operator",
      title: "Operator mode",
      subtitle: "Toggle debug HUD — fps, cursor, telemetry",
      group: "easter-egg",
      icon: "◇",
      hidden: true,
      keywords: ["operator", "debug", "tank", "konami", "hud"],
      shortcut: "Konami",
      run: () => {
        ctx.toggleEgg("operatorMode");
        ctx.closePalette();
      },
    },

    // System
    {
      id: "sys.cv",
      title: "View plain CV",
      subtitle: "The real world — printable, no simulation",
      group: "system",
      icon: "▤",
      keywords: ["cv", "resume", "print", "pdf", "recruiter", "hire", "real", "red pill"],
      run: () => {
        ctx.closePalette();
        ctx.showCv();
      },
    },
    {
      id: "sys.source",
      title: "View source",
      subtitle: "GitHub — aransys/matrix-portfolio",
      group: "system",
      icon: "◆",
      keywords: ["github", "source", "code", "repo"],
      run: () => {
        window.open("https://github.com/aransys/matrix-portfolio", "_blank", "noopener");
        ctx.closePalette();
      },
    },
    {
      id: "sys.email",
      title: "Copy email",
      subtitle: "ransys.dev@gmail.com",
      group: "system",
      icon: "✉",
      keywords: ["mail", "contact", "address"],
      run: () => {
        void navigator.clipboard.writeText("ransys.dev@gmail.com");
        ctx.showMessage("Email copied to clipboard");
        ctx.closePalette();
      },
    },
  ];
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}
