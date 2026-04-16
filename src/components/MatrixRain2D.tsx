import { useEffect, useRef } from "react";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface MatrixRain2DProps {
  theme: ThemeKey;
}

/** Half-width katakana + digits — closer to classic / rezmason-style pools */
const CHARS =
  "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789";

export function MatrixRain2D({ theme }: MatrixRain2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const dropsRef = useRef<number[]>([]);
  const speedsRef = useRef<number[]>([]);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const el = canvas;
    const context = ctx;
    const t = THEMES[theme];
    lastTimeRef.current = Date.now();

    const fontSize = 15;
    const columnSpacing = fontSize;
    /** Vertical trail length in character cells (rezmason-style long streaks) */
    const trailCells = 26;
    let columns = 0;

    const initColumns = () => {
      columns = Math.floor(el.width / columnSpacing);
      dropsRef.current = Array.from({ length: columns }, () => {
        const start = -(Math.random() * el.height) / fontSize - Math.random() * 40;
        return start;
      });
      speedsRef.current = Array.from(
        { length: columns },
        () => 0.35 + Math.random() * 0.55,
      );
    };

    const resize = () => {
      el.width = window.innerWidth;
      el.height = window.innerHeight;
      initColumns();
    };

    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    const draw = () => {
      frame += 1;
      const now = Date.now();
      const deltaTime = Math.min((now - lastTimeRef.current) / 16, 2);
      lastTimeRef.current = now;

      // Opaque clear each frame: empty space stays solid theme bg (no stacked semi-transparent
      // fades tinting the whole screen green / showing “ghost” paths where nothing is falling).
      context.globalAlpha = 1;
      context.fillStyle = t.bg;
      context.fillRect(0, 0, el.width, el.height);

      context.font = `${fontSize}px "JetBrains Mono", "Courier New", monospace`;
      context.textAlign = "left";
      context.textBaseline = "top";

      const drops = dropsRef.current;
      const speeds = speedsRef.current;

      for (let i = 0; i < drops.length; i++) {
        const x = i * columnSpacing;
        const headRow = drops[i];

        for (let k = 0; k < trailCells; k++) {
          const row = headRow - k;
          const y = row * fontSize;
          if (y < -fontSize || y > el.height + fontSize) continue;

          // Deterministic “shimmer” per cell + frame (cheap, rezmason-like glyph churn)
          const seed = (i * 1315423911 + k * 73856093 + frame * 19349663) >>> 0;
          const ch = CHARS[seed % CHARS.length];
          const flicker = (seed % 97) / 97 > 0.94 ? 0.12 : 0;

          // Head = bright; tail = stepped greens + fading alpha (classic column rain)
          if (k === 0) {
            context.fillStyle = t.accent;
            context.globalAlpha = Math.min(0.95, 0.82 + flicker);
          } else if (k < 3) {
            context.fillStyle = t.primary;
            context.globalAlpha = 0.78 * Math.pow(0.88, k) + flicker * 0.1;
          } else if (k < 10) {
            context.fillStyle = t.secondary;
            context.globalAlpha = 0.55 * Math.pow(0.9, k - 3) + flicker * 0.08;
          } else if (k < 18) {
            context.fillStyle = t.dim;
            context.globalAlpha = 0.38 * Math.pow(0.92, k - 10);
          } else {
            context.fillStyle = t.dim;
            context.globalAlpha = 0.22 * (1 - (k - 18) / (trailCells - 18));
          }

          context.fillText(ch, x, y);
        }

        context.globalAlpha = 1;

        drops[i] += speeds[i] * deltaTime * 0.52;

        if (drops[i] * fontSize > el.height + fontSize * 2) {
          drops[i] = -trailCells - Math.random() * 35;
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        backgroundColor: THEMES[theme].bg,
      }}
    />
  );
}
