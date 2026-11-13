import { useEffect, useRef, useState } from "react";

export interface DecodeLinkProps {
  href: string;
  /** The link text, without the prompt mark. */
  label: string;
}

/** Same width as the letters in the monospace face, so nothing shifts. */
const NOISE = "01<>/\\=+*#%$";
const FRAME_MS = 32;
/** Frames each letter stays scrambled before the one after it. */
const FRAMES_PER_LETTER = 2;

/**
 * A hero navigation link that reads as a line being typed at a prompt.
 * On hover or keyboard focus the label decodes left to right out of
 * noise and a block cursor lands after it. No box, no lift — just the
 * text coming into focus. Under reduced motion only the colour and the
 * cursor change.
 */
export function DecodeLink({ href, label }: DecodeLinkProps) {
  const [shown, setShown] = useState(label);
  const timer = useRef(0);

  const stop = () => {
    window.clearInterval(timer.current);
    timer.current = 0;
  };

  const decode = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stop();
    let frame = 0;
    timer.current = window.setInterval(() => {
      frame++;
      const settled = Math.floor(frame / FRAMES_PER_LETTER);
      if (settled >= label.length) {
        stop();
        setShown(label);
        return;
      }
      setShown(
        label.slice(0, settled) +
          Array.from(label.slice(settled), (ch) =>
            ch === " " ? ch : NOISE[Math.floor(Math.random() * NOISE.length)],
          ).join(""),
      );
    }, FRAME_MS);
  };

  const settle = () => {
    stop();
    setShown(label);
  };

  useEffect(() => stop, []);

  return (
    <a
      href={href}
      className="decode-link"
      // The scrambled text is decoration; assistive tech gets the real label.
      aria-label={label}
      onMouseEnter={decode}
      onMouseLeave={settle}
      onFocus={decode}
      onBlur={settle}
    >
      <span aria-hidden className="decode-link__mark">
        &gt;
      </span>
      <span aria-hidden className="decode-link__text">
        {shown}
      </span>
      <span aria-hidden className="decode-link__cursor" />
    </a>
  );
}
