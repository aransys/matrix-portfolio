export type BootLineType =
  | "dim"
  | "ok"
  | "warn"
  | "glitch"
  | "name"
  | "role";

export interface BootLine {
  text: string;
  type: BootLineType;
  delay: number;
  typeSpeed?: number;
}

export const BOOT_LINES: BootLine[] = [
  { text: "RANSYS SYSTEMS v2.0.26", type: "dim", delay: 80 },
  { text: "Initialising kernel...", type: "dim", delay: 500 },
  { text: "[  OK  ] Mounted /dev/portfolio", type: "ok", delay: 350 },
  { text: "[  OK  ] Started network daemon", type: "ok", delay: 280 },
  { text: "[  OK  ] Loaded skills.module", type: "ok", delay: 300 },
  { text: "[ WARN ] Matrix rain shader compiled", type: "warn", delay: 450 },
  { text: "[  OK  ] Connected to the construct", type: "ok", delay: 350 },
  { text: "", type: "dim", delay: 150 },
  { text: "Operator: Tank", type: "dim", delay: 500 },
  { text: '"We got a signal. Main line."', type: "dim", delay: 700 },
  { text: "", type: "dim", delay: 200 },
  { text: "GLITCH", type: "glitch", delay: 0 },
  { text: "", type: "dim", delay: 150 },
  { text: "AURIMAS RANSYS", type: "name", delay: 0, typeSpeed: 70 },
  { text: "", type: "dim", delay: 80 },
  { text: "Full Stack Developer", type: "role", delay: 0, typeSpeed: 35 },
  { text: "", type: "dim", delay: 80 },
  {
    text: "CS Student @ Leeds Beckett  //  Kaunas → Leeds",
    type: "dim",
    delay: 0,
    typeSpeed: 20,
  },
];
