import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ThemeKey } from "../../config/themes";
import { THEMES } from "../../config/themes";

export interface OperatorHudProps {
  active: boolean;
  theme: ThemeKey;
}

/**
 * Operator HUD — Konami code unlock. A subtle telemetry panel pinned to
 * the bottom-left: FPS, cursor coordinates, viewport, active theme.
 * Looks like Tank's console from the Nebuchadnezzar.
 */
export function OperatorHud({ active, theme }: OperatorHudProps) {
  const [fps, setFps] = useState(60);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    // FPS via rolling average over the last 60 frames
    let frameCount = 0;
    let last = performance.now();
    let acc = 0;
    const loop = () => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      acc += delta;
      frameCount += 1;
      if (frameCount >= 30) {
        setFps(Math.round(1000 / (acc / frameCount)));
        frameCount = 0;
        acc = 0;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, [active]);

  const t = THEMES[theme];

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
          aria-label="Operator telemetry"
          style={{
            position: "fixed",
            bottom: "clamp(12px, 2vw, 18px)",
            left: "clamp(12px, 2vw, 18px)",
            zIndex: 90,
            padding: "10px 14px",
            background: "rgba(0,0,0,0.78)",
            border: "1px solid var(--c-border-strong)",
            borderRadius: "var(--r-md)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            fontFamily: "inherit",
            fontSize: "11px",
            color: "var(--c-primary)",
            lineHeight: 1.55,
            minWidth: "220px",
            boxShadow: "0 12px 32px -10px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
              paddingBottom: "6px",
              borderBottom: "1px solid var(--c-border)",
            }}
          >
            <span
              className="tag"
              style={{
                color: "var(--c-secondary)",
                fontSize: "9px",
                letterSpacing: "0.25em",
              }}
            >
              OPERATOR · TANK
            </span>
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--c-primary)",
                boxShadow: "0 0 8px var(--c-glow)",
                animation: "cursorBlink 1.4s infinite",
              }}
            />
          </div>
          <Row label="FPS" value={`${fps}`} accent={fps < 40 ? "low" : fps > 55 ? "ok" : "mid"} />
          <Row label="CURSOR" value={`${cursor.x}, ${cursor.y}`} />
          <Row label="VIEWPORT" value={`${viewport.w} × ${viewport.h}`} />
          <Row label="THEME" value={`${t.name.toUpperCase()} · ${t.tagline}`} />
          <Row label="DPR" value={`${(window.devicePixelRatio ?? 1).toFixed(2)}`} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "low" | "mid" | "ok";
}) {
  const valueColor =
    accent === "low" ? "#ff6b6b" : accent === "ok" ? "var(--c-primary)" : "var(--c-secondary)";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <span style={{ color: "var(--c-dim)", letterSpacing: "0.1em" }}>{label}</span>
      <span style={{ color: valueColor, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
