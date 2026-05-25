import { useEffect, useRef, useState } from "react";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface MatrixRainProps {
  theme: ThemeKey;
  /** Override the head density per column (0–1). Lower = fewer drops. */
  density?: number;
  /**
   * Multiplier on the active stream count. The cinematic hero looks best
   * when ~60% of columns are running; lift to 1 for a denser storm during
   * easter eggs.
   */
  intensity?: number;
}

/**
 * Digital rain orchestrator.
 *
 * Attempts WebGL2 first (single full-screen fragment shader, ~1-2ms/frame
 * on low-end GPUs). If WebGL2 or shader compilation fails — older devices,
 * locked-down browsers, headless contexts — falls back to a richer 2D
 * canvas implementation with depth layers.
 *
 * Both implementations:
 *   - honour `prefers-reduced-motion` (render one frame, then stop)
 *   - pause when the tab is hidden
 *   - resize on viewport changes (debounced via rAF)
 *   - read colours from the active theme without re-mounting
 */
export function MatrixRain({ theme, density = 0.6, intensity = 0.7 }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<"webgl" | "2d" | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Try WebGL2 first; fall back to 2D if it can't compile.
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      // Power preference cue: hint at low-power so this never spins up the
      // discrete GPU just for ambient rain.
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });

    // `setRenderer` is called in the body to flip the `data-renderer`
    // attribute on the canvas (useful for debugging). It runs once per
    // theme/density change — not the cascading pattern the lint rule
    // warns about.
    if (gl) {
      const ok = startWebGL(gl, theme, density, intensity);
      if (ok) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRenderer("webgl");
        return ok.cleanup;
      }
    }

    // Fallback: 2D canvas
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const cleanup = start2D(ctx, theme);
    setRenderer("2d");
    return cleanup;
  }, [theme, density, intensity]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        data-renderer={renderer ?? "init"}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          backgroundColor: THEMES[theme].bg,
        }}
      />
      {/* Subtle gradient wash over the rain so deep content reads cleanly */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </>
  );
}

/* ============================ WebGL renderer ============================ */

interface WebGLHandle {
  cleanup: () => void;
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * Procedural digital-rain shader.
 *
 * Approach:
 *   - Divide screen into a grid of `CELL_PX` cells.
 *   - Each column streams a "head" downward at a per-column speed.
 *   - Cell colour depends on its distance from that head.
 *   - The glyph drawn in each cell is a procedurally-hashed 5x7 binary
 *     pattern — cheap, varied, and re-randomises a few times per second
 *     to mimic the classic "flickering glyphs" of rezmason's rain.
 *   - A second, slower layer behind it gives depth without overlap.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 frag;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_density;
uniform float u_intensity;
uniform vec3 u_bg;
uniform vec3 u_head;
uniform vec3 u_bright;
uniform vec3 u_body;
uniform vec3 u_dim;

const float CELL_PX = 16.0;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

/** 5x5 procedural glyph — binary pattern hashed from (cell, glyphId) */
float glyph(vec2 cellUV, float glyphId) {
  vec2 g = floor(cellUV * 5.0);
  // Edge mask so glyphs don't tile into a solid block
  if (g.x < 0.0 || g.x > 4.0 || g.y < 0.0 || g.y > 4.0) return 0.0;
  float h = hash21(vec2(g.x + glyphId * 47.13, g.y + glyphId * 31.97));
  return step(0.55, h);
}

/**
 * Render a single rain layer.
 * depth 0 = front (fast, bright), 1 = back (slower, dimmer).
 */
vec3 layer(vec2 px, float depth) {
  float cs = CELL_PX * mix(1.0, 1.4, depth);
  vec2 cell = floor(px / cs);
  vec2 cellUV = fract(px / cs);

  float col = cell.x;
  float seed = hash11(col + depth * 73.0);
  // Active probability — sparse columns make the rain feel less uniform
  float active = step(1.0 - u_density * mix(1.0, 0.7, depth), hash11(col + 19.0 + depth * 5.0));

  float speed = mix(6.0, 14.0, seed) * mix(1.0, 0.55, depth);
  float headY = u_time * speed - seed * 200.0;
  float row = cell.y;
  float numRows = u_resolution.y / cs + 30.0;
  float dist = headY - row;
  dist = mod(dist, numRows);

  // Glyph churn — re-randomise a few times per second per cell
  float churn = floor(u_time * 6.5 + col * 7.0 + row * 3.0);
  float glyphId = hash21(vec2(col + churn, row + depth * 11.0));
  float g = glyph(cellUV, glyphId * 100.0);

  // Distance-to-head colour ramp
  vec3 c;
  float trailLen = 24.0;
  if (dist < 0.0 || dist > trailLen) {
    return vec3(0.0);
  } else if (dist < 1.0) {
    c = u_head;
  } else if (dist < 2.5) {
    c = mix(u_bright, u_head, 1.0 - smoothstep(1.0, 2.5, dist));
  } else if (dist < 8.0) {
    c = mix(u_body, u_bright, exp(-(dist - 2.5) * 0.35));
  } else {
    c = mix(u_dim, u_body, exp(-(dist - 8.0) * 0.18));
  }

  // Random flicker (sparse)
  float flick = step(0.985, hash21(vec2(col * 7.0 + churn, row + 13.0)));
  c += flick * 0.25;

  return c * g * active * mix(1.0, 0.55, depth) * u_intensity;
}

void main() {
  vec2 px = v_uv * u_resolution;
  // Flip Y so rain falls downward (WebGL y points up)
  px.y = u_resolution.y - px.y;

  vec3 col = u_bg;
  col += layer(px, 0.0);            // front layer
  col += layer(px + vec2(7.3, 0.0), 1.0) * 0.45; // back layer, slight x offset

  // Cheap vignette
  float vig = smoothstep(1.2, 0.35, length(v_uv - 0.5));
  col *= mix(0.55, 1.0, vig);

  frag = vec4(col, 1.0);
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("[matrix-rain] shader compile failed:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function startWebGL(
  gl: WebGL2RenderingContext,
  themeKey: ThemeKey,
  density: number,
  intensity: number,
): WebGLHandle | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("[matrix-rain] program link failed:", gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  // Fullscreen quad — 6 verts, 2 triangles
  const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(prog, "u_resolution");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uDensity = gl.getUniformLocation(prog, "u_density");
  const uIntensity = gl.getUniformLocation(prog, "u_intensity");
  const uBg = gl.getUniformLocation(prog, "u_bg");
  const uHead = gl.getUniformLocation(prog, "u_head");
  const uBright = gl.getUniformLocation(prog, "u_bright");
  const uBody = gl.getUniformLocation(prog, "u_body");
  const uDim = gl.getUniformLocation(prog, "u_dim");

  const t = THEMES[themeKey];
  gl.uniform3fv(uBg, hexToRgb(t.bg));
  gl.uniform3fv(uHead, hexToRgb(t.rainHead));
  gl.uniform3fv(uBright, hexToRgb(t.rainBright));
  gl.uniform3fv(uBody, hexToRgb(t.rainBody));
  gl.uniform3fv(uDim, hexToRgb(t.rainDim));
  gl.uniform1f(uDensity, density);
  gl.uniform1f(uIntensity, intensity);

  const canvas = gl.canvas as HTMLCanvasElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    }
  }
  resize();

  let rafId = 0;
  let running = true;
  const startTime = performance.now();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function frame() {
    if (!running) return;
    const now = performance.now();
    const elapsed = (now - startTime) / 1000;
    gl.uniform1f(uTime, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (!reducedMotion) {
      rafId = requestAnimationFrame(frame);
    }
  }
  frame();

  let resizeRaf = 0;
  function onResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resize();
      resizeRaf = 0;
    });
  }
  window.addEventListener("resize", onResize);

  function onVisibility() {
    if (document.hidden) {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    } else if (!reducedMotion) {
      running = true;
      frame();
    }
  }
  document.addEventListener("visibilitychange", onVisibility);

  return {
    cleanup() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}

function hexToRgb(hex: string): Float32Array {
  const h = hex.replace("#", "");
  const expand = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(expand.slice(0, 2), 16) / 255;
  const g = parseInt(expand.slice(2, 4), 16) / 255;
  const b = parseInt(expand.slice(4, 6), 16) / 255;
  return new Float32Array([r, g, b]);
}

/* ============================== 2D fallback ============================== */

/** Half-width katakana + digits — classic rezmason-style glyph pool */
const FALLBACK_CHARS =
  "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789";

function start2D(
  ctx: CanvasRenderingContext2D,
  themeKey: ThemeKey,
): () => void {
  const canvas = ctx.canvas;
  const t = THEMES[themeKey];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fontSize = 15;
  const trailCells = 26;
  let columns = 0;
  let drops: number[] = [];
  let speeds: number[] = [];
  let last = performance.now();

  function init() {
    columns = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: columns }, () => -(Math.random() * 60));
    speeds = Array.from({ length: columns }, () => 0.35 + Math.random() * 0.55);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
  }
  resize();
  window.addEventListener("resize", resize);

  let raf = 0;
  let frame = 0;
  function draw() {
    frame += 1;
    const now = performance.now();
    const dt = Math.min((now - last) / 16, 2);
    last = now;

    ctx.globalAlpha = 1;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px "JetBrains Mono", "Courier New", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    for (let i = 0; i < columns; i++) {
      const x = i * fontSize;
      const head = drops[i];

      for (let k = 0; k < trailCells; k++) {
        const row = head - k;
        const y = row * fontSize;
        if (y < -fontSize || y > canvas.height + fontSize) continue;

        const seed = (i * 1315423911 + k * 73856093 + frame * 19349663) >>> 0;
        const ch = FALLBACK_CHARS[seed % FALLBACK_CHARS.length];
        const flick = (seed % 97) / 97 > 0.94 ? 0.12 : 0;

        if (k === 0) {
          ctx.fillStyle = t.rainHead;
          ctx.globalAlpha = 0.95 + flick;
        } else if (k < 3) {
          ctx.fillStyle = t.rainBright;
          ctx.globalAlpha = 0.78 * Math.pow(0.88, k);
        } else if (k < 10) {
          ctx.fillStyle = t.rainBody;
          ctx.globalAlpha = 0.55 * Math.pow(0.9, k - 3);
        } else if (k < 18) {
          ctx.fillStyle = t.rainDim;
          ctx.globalAlpha = 0.38 * Math.pow(0.92, k - 10);
        } else {
          ctx.fillStyle = t.rainDim;
          ctx.globalAlpha = 0.22 * (1 - (k - 18) / (trailCells - 18));
        }
        ctx.fillText(ch, x, y);
      }

      ctx.globalAlpha = 1;
      drops[i] += speeds[i] * dt * 0.52;
      if (drops[i] * fontSize > canvas.height + fontSize * 2) {
        drops[i] = -trailCells - Math.random() * 35;
      }
    }

    if (!reducedMotion) raf = requestAnimationFrame(draw);
  }

  function onVisibility() {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (!reducedMotion && raf === 0) {
      last = performance.now();
      draw();
    }
  }
  document.addEventListener("visibilitychange", onVisibility);
  draw();

  return () => {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
