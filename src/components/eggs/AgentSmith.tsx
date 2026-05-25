import { useEffect, useRef, useState } from "react";

export interface AgentSmithProps {
  active: boolean;
}

interface Trail {
  x: number;
  y: number;
}

const NUM_CLONES = 5;
const FOLLOW_DELAY_MS = 60;

/**
 * Agent Smith — the cursor replicates into trailing echoes.
 *
 * Each clone reads the cursor position from a delayed slot in a ring
 * buffer, producing the "Mr. Anderson… Mr. Anderson… Mr. Anderson…"
 * cascade effect. Disabled on touch-only devices where there's no
 * pointer to clone.
 */
export function AgentSmith({ active }: AgentSmithProps) {
  const [positions, setPositions] = useState<Trail[]>([]);
  const bufferRef = useRef<Trail[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastMouseRef = useRef<Trail | null>(null);

  useEffect(() => {
    if (!active) return;

    // No pointer? Bail early — touch devices have no cursor to clone.
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return;

    const onMove = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const tick = () => {
      if (lastMouseRef.current) {
        bufferRef.current.push(lastMouseRef.current);
        // Cap buffer length to avoid unbounded growth
        const maxLen = NUM_CLONES * 30;
        if (bufferRef.current.length > maxLen) {
          bufferRef.current = bufferRef.current.slice(-maxLen);
        }
        const frames = Math.floor(FOLLOW_DELAY_MS / 16);
        const next: Trail[] = [];
        for (let i = 1; i <= NUM_CLONES; i++) {
          const idx = bufferRef.current.length - 1 - i * frames;
          if (idx < 0) continue;
          next.push(bufferRef.current[idx]);
        }
        setPositions(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      // Clear the trail on deactivation so the next activation starts fresh.
      setPositions([]);
      bufferRef.current = [];
    };
  }, [active]);

  if (!active || positions.length === 0) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9997,
        pointerEvents: "none",
      }}
    >
      {positions.map((p, i) => {
        const opacity = (1 - i / NUM_CLONES) * 0.85;
        const scale = 1 - i * 0.05;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              transform: `translate(-50%, -50%) scale(${scale})`,
              fontSize: "20px",
              color: "var(--c-primary)",
              opacity,
              textShadow: "0 0 12px var(--c-glow)",
              filter: `blur(${i * 0.3}px)`,
              transition: "opacity 0.15s linear",
              userSelect: "none",
              fontWeight: 700,
            }}
          >
            ▲
          </div>
        );
      })}
    </div>
  );
}
