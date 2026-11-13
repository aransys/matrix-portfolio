import { Fragment, useEffect, useRef, useState } from "react";
import { RAIN_FONT_STACK, RAIN_GLYPHS } from "../config/glyphs";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface HeroNameProps {
  text: string;
  theme: ThemeKey;
  /** Fired once the name is fully on screen (immediately if no intro runs). */
  onResolved?: () => void;
  onClick?: () => void;
}

/**
 * Kept in memory only, so the intro plays on every page load (including a
 * reload) but not a second time when the hero remounts within one load —
 * coming back from the plain CV view, for instance.
 */
let introPlayed = false;

/** The intro plays once per page load and never under reduced motion. */
function shouldPlayIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return !introPlayed;
}

function markIntroSeen() {
  introPlayed = true;
}

/** Latest time a letter's stream starts falling. */
const MAX_START_DELAY_MS = 800;
/** How long a stream takes to reach its letter, min + random spread. */
const FALL_MS = { min: 550, spread: 450 };
/** The stream head churns on the letter's slot this long before it locks. */
const CHURN_MS = 170;
/** Time for a locked letter's stream to fade away. */
const TRAIL_FADE_MS = 450;
const TRAIL_CELLS = 12;

/**
 * The hero's name, resolved out of the rain.
 *
 * The real `<h1>` text is in the DOM from the first paint (hidden while the
 * intro runs), so layout never shifts and assistive tech reads the name
 * straight away. On every page load, a stream of glyphs falls down
 * each letter's column on a temporary overlay canvas; when a stream's head
 * reaches its letter the letter locks in white-hot and cools to the theme
 * colour. Any click, key press, scroll or resize finishes it immediately.
 */
export function HeroName({ text, theme, onResolved, onClick }: HeroNameProps) {
  const [intro, setIntro] = useState(shouldPlayIntro);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const themeRef = useRef(theme);
  const onResolvedRef = useRef(onResolved);
  useEffect(() => {
    themeRef.current = theme;
    onResolvedRef.current = onResolved;
  });

  useEffect(() => {
    if (!intro) {
      onResolvedRef.current?.();
      return;
    }
    const heading = headingRef.current;
    if (!heading) return;
    const letters = Array.from(heading.querySelectorAll<HTMLElement>("[data-letter]"));

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      zIndex: "2",
      pointerEvents: "none",
    });
    document.body.appendChild(canvas);

    const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchmove", "resize"] as const;
    let raf = 0;
    let stopped = false;
    const timers: number[] = [];

    function teardown() {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      SKIP_EVENTS.forEach((ev) => window.removeEventListener(ev, finish));
      canvas.remove();
      for (const el of letters) {
        // Back to the hidden state React rendered, so a re-run starts clean.
        el.style.opacity = "0";
        el.style.color = "";
        el.style.textShadow = "";
      }
    }

    function finish() {
      if (stopped) return;
      teardown();
      for (const el of letters) el.style.opacity = "1";
      markIntroSeen();
      setIntro(false);
    }

    SKIP_EVENTS.forEach((ev) => window.addEventListener(ev, finish, { passive: true }));

    function reveal(el: HTMLElement) {
      const t = THEMES[themeRef.current];
      el.style.color = t.rainHead;
      el.style.textShadow = `0 0 18px ${t.rainHead}, 0 0 44px ${t.primary}`;
      el.style.opacity = "1";
      // Next tick: drop the overrides so the CSS transition cools the
      // letter down to the theme colour.
      timers.push(
        window.setTimeout(() => {
          el.style.color = "";
          el.style.textShadow = "";
        }, 90),
      );
    }

    function start() {
      if (stopped) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        finish();
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.scale(dpr, dpr);

      // Noticeably larger than the background rain so the streams read as
      // their own event, even on a phone.
      const fontSize = parseFloat(getComputedStyle(heading!).fontSize);
      const cell = Math.round(Math.min(34, Math.max(22, fontSize * 0.4)));

      const streams = letters.map((el, i) => {
        const r = el.getBoundingClientRect();
        const targetY = r.top + r.height / 2;
        return {
          el,
          x: r.left + r.width / 2,
          targetY,
          // Whole cells from above the viewport down to the letter.
          rows: Math.ceil((targetY + cell) / cell),
          delay: Math.random() * MAX_START_DELAY_MS,
          fall: FALL_MS.min + Math.random() * FALL_MS.spread,
          seed: i * 7919,
          lockedAt: -1,
        };
      });

      const startTime = performance.now();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `600 ${cell}px ${RAIN_FONT_STACK}`;

      function frame(now: number) {
        if (stopped) return;
        const elapsed = now - startTime;
        const t = THEMES[themeRef.current];
        const tick = Math.floor(elapsed / 70);
        ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);

        let pending = false;
        for (const s of streams) {
          const local = elapsed - s.delay;
          if (local < 0) {
            pending = true;
            continue;
          }
          const arrived = local >= s.fall;
          if (arrived && s.lockedAt < 0 && local >= s.fall + CHURN_MS) {
            s.lockedAt = elapsed;
            reveal(s.el);
          }
          const fade =
            s.lockedAt < 0 ? 1 : 1 - (elapsed - s.lockedAt) / TRAIL_FADE_MS;
          if (fade <= 0) continue;
          pending = true;

          // Head advances a whole cell at a time, like the real thing:
          // glyphs stay put and the light moves through them.
          const headRow = arrived
            ? s.rows
            : Math.floor((local / s.fall) * s.rows);
          const from = s.lockedAt < 0 ? 0 : 1; // the letter replaces the head
          for (let k = from; k < TRAIL_CELLS; k++) {
            const row = headRow - k;
            if (row < 0) break;
            const y = s.targetY - (s.rows - row) * cell;
            const glyphSeed = (s.seed + row * 131 + (k === 0 ? tick * 17 : (tick >> 3) * 29)) >>> 0;
            ctx!.fillStyle = k === 0 ? t.rainHead : k < 3 ? t.rainBright : t.rainBody;
            ctx!.globalAlpha = fade * (k === 0 ? 1 : Math.pow(0.8, k));
            if (k === 0) {
              ctx!.shadowColor = t.primary;
              ctx!.shadowBlur = 16;
            } else {
              ctx!.shadowBlur = 0;
            }
            ctx!.fillText(RAIN_GLYPHS[glyphSeed % RAIN_GLYPHS.length], s.x, y);
          }
        }
        ctx!.globalAlpha = 1;
        ctx!.shadowBlur = 0;

        if (pending) raf = requestAnimationFrame(frame);
        else finish();
      }
      raf = requestAnimationFrame(frame);
    }

    // Measure after the display font has loaded so each stream lands on
    // its letter's final position — but never wait long for it.
    void Promise.race([
      document.fonts.load('700 1em "Space Grotesk"').catch(() => undefined),
      new Promise((resolve) => window.setTimeout(resolve, 900)),
    ]).then(start);

    return () => {
      // After a normal finish React owns the letters again — don't re-hide.
      if (!stopped) teardown();
    };
  }, [intro]);

  return (
    <h1
      ref={headingRef}
      onClick={onClick}
      aria-label={text}
      className="font-display hero-name"
      title="Three taps reveals a choice"
    >
      {text.split(" ").map((word, w) => (
        <Fragment key={w}>
          {w > 0 && " "}
          <span aria-hidden className="hero-name__word">
            {Array.from(word).map((ch, i) => (
              <span
                key={i}
                data-letter
                className="hero-name__letter"
                style={{ opacity: intro ? 0 : 1 }}
              >
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </h1>
  );
}
