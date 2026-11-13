/**
 * "Follow the white rabbit" — the site's one hidden trail.
 *
 * Five things to find, spread across the shell and the page. Progress is
 * kept in localStorage so a visitor can come back to it. The first four
 * can be found in any order; the last only opens once they are all in.
 */

export type TrailStepId = "hole" | "rabbit" | "pill" | "origin" | "spoon";

export interface TrailStep {
  id: TrailStepId;
  /** Shown once found. */
  label: string;
  /** The line from the film this step is built on. */
  quote: string;
  /** Plain directions to this step. */
  clue: string;
  /** Label for the tracker's "take me there" button. */
  go: string;
}

export const TRAIL_STEPS: TrailStep[] = [
  {
    id: "hole",
    label: "went down the rabbit hole",
    quote: "Follow the white rabbit.",
    clue: "Drop into the shell and list everything, hidden files too: ls -a. Then read what you find with cat.",
    go: "open the shell",
  },
  {
    id: "rabbit",
    label: "caught the white rabbit",
    quote: "Knock, knock, Neo.",
    clue: "A small white rabbit is hiding in the corner of one of the mission cards. Catch it.",
    go: "go to the missions",
  },
  {
    id: "pill",
    label: "made the choice",
    quote: "This is your last chance. After this, there is no turning back.",
    clue: "Catch the rabbit and take a pill. Red or blue, it is your choice — just make it.",
    go: "go to the missions",
  },
  {
    id: "origin",
    label: "traced the signal",
    quote: "Are you sure this line is clean?",
    clue: "Scroll the trajectory until the trace completes, then touch the place the signal began.",
    go: "go to the timeline",
  },
  {
    id: "spoon",
    label: "freed your mind",
    quote: "Do not try and bend the spoon. That's impossible. Instead, only try to realise the truth.",
    clue: "Tell the shell the truth the boy told Neo: there is no _____.",
    go: "open the shell",
  },
];

/** The last step — locked until every other step is found. */
export const FINAL_STEP: TrailStepId = "spoon";

const STORAGE_KEY = "ransys.dev:trail";
const VALID = new Set<string>(TRAIL_STEPS.map((s) => s.id));

/** Loaded once, then kept in memory so progress survives blocked storage. */
let cache: TrailStepId[] | null = null;
const listeners = new Set<() => void>();

function load(): TrailStepId[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is TrailStepId => typeof id === "string" && VALID.has(id));
  } catch {
    return [];
  }
}

function save(found: TrailStepId[]) {
  cache = found;
  try {
    if (found.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: progress lasts for this visit only.
  }
  listeners.forEach((notify) => notify());
}

/** Steps found so far. The same array is returned until it changes. */
export function getFound(): TrailStepId[] {
  cache ??= load();
  return cache;
}

/** Record a step. Returns true the first time it is found. */
export function markFound(id: TrailStepId): boolean {
  const found = getFound();
  if (found.includes(id)) return false;
  save([...found, id]);
  return true;
}

export function resetTrail(): void {
  save([]);
}

/** Subscribe to progress changes (for `useSyncExternalStore`). */
export function subscribeTrail(notify: () => void): () => void {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** The step to point at next, or undefined when the trail is finished. */
export function nextStep(found: readonly string[]): TrailStep | undefined {
  return TRAIL_STEPS.find(
    (s) => !found.includes(s.id) && (s.id !== FINAL_STEP || finaleUnlocked(found)),
  );
}

/** True once everything before the final step has been found. */
export function finaleUnlocked(found: readonly string[]): boolean {
  return TRAIL_STEPS.every((s) => s.id === FINAL_STEP || found.includes(s.id));
}

/** "3/5" */
export function trailCount(found: readonly string[]): string {
  return `${found.length}/${TRAIL_STEPS.length}`;
}
