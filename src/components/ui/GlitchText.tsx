import { useEffect, useRef, useState } from "react";

export interface GlitchTextProps {
  text: string;
  /**
   * Whether the glitch effect is actively running. The hero pulses this
   * briefly on theme change for a "system tear" feel.
   */
  active?: boolean;
  /** Tag rendered — defaults to `span`. */
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3";
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

/**
 * Wraps text with the global `.glitch-text` class so its theme-coloured
 * ghost layers offset slightly. `data-glitching=true` switches on the
 * keyframe-driven shift defined in global.css.
 */
export function GlitchText({
  text,
  active = false,
  as = "span",
  className,
  style,
}: GlitchTextProps) {
  const Component = as as "span";
  return (
    <Component
      className={`glitch-text ${className ?? ""}`}
      data-text={text}
      data-glitching={active ? "true" : "false"}
      style={style}
    >
      {text}
    </Component>
  );
}

/**
 * Renders text that progressively "decodes" — characters cycle through a
 * scramble pool before settling into the target glyph, one row of pixels at
 * a time. Used for section titles and the hero name reveal.
 */
const SCRAMBLE_POOL = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ01ｦﾟ⌘$_+#@!?";

export interface DecodeTextProps {
  text: string;
  /** ms per character before locking in */
  speed?: number;
  /** Trigger replay when this changes */
  trigger?: unknown;
  className?: string;
  style?: React.CSSProperties;
}

export function DecodeText({
  text,
  speed = 36,
  trigger,
  className,
  style,
}: DecodeTextProps) {
  const [output, setOutput] = useState(() => text);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Snap to final text when motion is suppressed. Single setState
      // followed by return — no cascading risk.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOutput(text);
      return;
    }

    const chars = text.split("");
    const settledAt: number[] = chars.map((_, i) => i * speed * 0.4 + Math.random() * speed * 8);
    const start = performance.now();

    const tick = () => {
      const now = performance.now() - start;
      let allDone = true;
      const next = chars.map((target, i) => {
        if (now > settledAt[i]) return target;
        allDone = false;
        if (target === " ") return " ";
        return SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
      });
      setOutput(next.join(""));
      if (!allDone) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [text, speed, trigger]);

  return (
    <span className={className} style={style} aria-label={text}>
      <span aria-hidden>{output}</span>
    </span>
  );
}
