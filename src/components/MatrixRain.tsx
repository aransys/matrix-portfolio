import { useEffect, useRef } from "react";
import { RAIN_FONT_STACK, RAIN_GLYPHS } from "../config/glyphs";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface MatrixRainProps {
  theme: ThemeKey;
  /** Share of columns carrying a stream (0–1). Lower = sparser rain. */
  density?: number;
  /** Overall brightness multiplier for the rain. */
  intensity?: number;
}

/** A running renderer. `setTheme` recolours it without restarting. */
interface RainHandle {
  setTheme: (key: ThemeKey) => void;
  cleanup: () => void;
}

/**
 * Digital rain orchestrator.
 *
 * Attempts WebGL2 first (one full-screen fragment shader sampling a glyph
 * atlas). If WebGL2 or shader compilation fails — older devices,
 * locked-down browsers — falls back to a 2D canvas implementation.
 *
 * Both implementations:
 *   - draw real katakana glyphs from the shared pool
 *   - honour `prefers-reduced-motion` (render one frame, then stop)
 *   - pause when the tab is hidden
 *   - resize on viewport changes
 *   - recolour on theme change without re-mounting, so the streams keep
 *     falling while the palette blends
 */
export function MatrixRain({ theme, density = 0.6, intensity = 0.7 }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<RainHandle | null>(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let handle: RainHandle | null = null;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      // Hint at low-power so ambient rain never spins up a discrete GPU.
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    if (gl) handle = startWebGL(gl, themeRef.current, density, intensity);
    if (handle) {
      canvas.dataset.renderer = "webgl";
    } else {
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;
      handle = start2D(ctx, themeRef.current);
      canvas.dataset.renderer = "2d";
    }

    handleRef.current = handle;
    return () => {
      handleRef.current = null;
      handle.cleanup();
    };
  }, [density, intensity]);

  useEffect(() => {
    themeRef.current = theme;
    handleRef.current?.setTheme(theme);
  }, [theme]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        data-renderer="init"
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

/* ============================== Glyph atlas ============================== */

const ATLAS_GRID = 8;
const ATLAS_CELL = 64;

/** Paint the glyph pool into an 8×8 white-on-black grid for the shader. */
function createGlyphAtlas(): HTMLCanvasElement | null {
  const atlas = document.createElement("canvas");
  atlas.width = atlas.height = ATLAS_GRID * ATLAS_CELL;
  const ctx = atlas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, atlas.width, atlas.height);
  ctx.fillStyle = "#fff";
  // Glyphs sit well inside their cell so neighbours never bleed together
  // when the texture is minified.
  ctx.font = `600 ${ATLAS_CELL * 0.7}px ${RAIN_FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  RAIN_GLYPHS.forEach((ch, i) => {
    const x = (i % ATLAS_GRID) * ATLAS_CELL + ATLAS_CELL / 2;
    const y = Math.floor(i / ATLAS_GRID) * ATLAS_CELL + ATLAS_CELL / 2;
    ctx.fillText(ch, x, y + ATLAS_CELL * 0.04);
  });
  return atlas;
}

/* ============================ WebGL renderer ============================ */

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * Digital-rain shader.
 *
 *   - The screen is a grid of `u_cell`-sized cells; each cell shows one
 *     glyph from the atlas, mirrored like the film's.
 *   - Each column streams a "head" downward at its own speed; a cell's
 *     colour depends on how far behind the head it sits.
 *   - Glyphs mostly hold still. A minority of cells re-roll quickly, the
 *     rest only every few seconds.
 *   - A second, larger and slower layer behind gives depth.
 *   - The rain brightens in a soft pool around the pointer.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 frag;

uniform sampler2D u_atlas;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_cell;
uniform float u_density;
uniform float u_intensity;
uniform vec2 u_pointer;
uniform float u_pointerRadius;
uniform vec3 u_bg;
uniform vec3 u_head;
uniform vec3 u_bright;
uniform vec3 u_body;
uniform vec3 u_dim;

const float ATLAS_GRID = 8.0;

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

/** Coverage of atlas glyph id (0..1) at cellUV, mirrored on x. */
float glyph(vec2 cellUV, float id, float cellPx) {
  float idx = min(floor(id * ATLAS_GRID * ATLAS_GRID), ATLAS_GRID * ATLAS_GRID - 1.0);
  vec2 atlasCell = vec2(mod(idx, ATLAS_GRID), floor(idx / ATLAS_GRID));
  vec2 uv = (atlasCell + vec2(1.0 - cellUV.x, cellUV.y)) / ATLAS_GRID;
  // Explicit gradients: the UV jumps at every cell edge, which would
  // otherwise make the GPU pick a blurry mip level along the grid lines.
  float g = 1.0 / (cellPx * ATLAS_GRID);
  return textureGrad(u_atlas, uv, vec2(g, 0.0), vec2(0.0, g)).r;
}

/** One rain layer. depth 0 = front (fast, bright), 1 = back (slow, dim). */
vec3 layer(vec2 px, float depth) {
  float cs = u_cell * mix(1.0, 1.5, depth);
  vec2 cell = floor(px / cs);
  vec2 cellUV = fract(px / cs);
  float col = cell.x;
  float row = cell.y;

  float seed = hash11(col + depth * 73.0);
  float lit = step(1.0 - u_density * mix(1.0, 0.7, depth), hash11(col + 19.0 + depth * 5.0));

  float speed = mix(5.0, 13.0, seed) * mix(1.0, 0.55, depth);
  float trailLen = mix(14.0, 34.0, hash11(col * 1.7 + 3.0 + depth * 11.0));
  float numRows = u_resolution.y / cs + trailLen + 12.0 * hash11(col + 41.0);
  float dist = mod(u_time * speed - seed * 200.0 - row, numRows);
  if (dist > trailLen) return vec3(0.0);

  // Most cells hold their glyph for seconds; roughly one in six churns.
  float cellSeed = hash21(vec2(col + depth * 17.0, row));
  float rate = cellSeed > 0.84 ? 5.0 : 0.35;
  float tick = floor(u_time * rate + cellSeed * 40.0);
  float g = glyph(cellUV, hash21(vec2(col + tick * 3.1, row + depth * 11.0 + tick)), cs);

  // Distance-to-head colour ramp
  vec3 c;
  if (dist < 1.0) {
    c = u_head;
  } else if (dist < 2.5) {
    c = mix(u_bright, u_head, 1.0 - smoothstep(1.0, 2.5, dist));
  } else if (dist < 8.0) {
    c = mix(u_body, u_bright, exp(-(dist - 2.5) * 0.35));
  } else {
    c = mix(u_dim, u_body, exp(-(dist - 8.0) * 0.18));
  }
  // Tail dissolves instead of cutting off
  c *= 1.0 - smoothstep(trailLen * 0.55, trailLen, dist);

  // Sparse sparkle on churning cells
  c += step(0.97, hash21(vec2(col * 7.0 + tick, row + 13.0))) * 0.2;

  return c * g * lit * mix(1.0, 0.5, depth) * u_intensity;
}

void main() {
  vec2 px = v_uv * u_resolution;
  // Flip Y so rain falls downward (WebGL y points up)
  px.y = u_resolution.y - px.y;

  vec3 rain = layer(px + vec2(u_cell * 0.37, 0.0), 1.0) * 0.5; // back
  rain += layer(px, 0.0);                                        // front

  // Soft pool of brighter code around the pointer
  float d = distance(px, u_pointer) / u_pointerRadius;
  rain *= 1.0 + 1.1 * exp(-d * d);

  // Cheap vignette
  float vig = smoothstep(1.2, 0.35, length(v_uv - 0.5));
  frag = vec4((u_bg + rain) * mix(0.55, 1.0, vig), 1.0);
}
`;

/** Front-layer cell size in CSS pixels. */
const CELL_CSS_PX = 18;
/** Radius of the pointer highlight in CSS pixels. */
const POINTER_RADIUS_CSS_PX = 170;
/** Higher = faster palette blend on theme change (≈ 0.6s to settle). */
const THEME_BLEND_RATE = 6;

const RAMP_KEYS = ["bg", "rainHead", "rainBright", "rainBody", "rainDim"] as const;

function themeRamp(key: ThemeKey): Float32Array<ArrayBuffer> {
  const t = THEMES[key];
  const out = new Float32Array(RAMP_KEYS.length * 3);
  RAMP_KEYS.forEach((k, i) => out.set(hexToRgb(t[k]), i * 3));
  return out;
}

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
): RainHandle | null {
  const atlas = createGlyphAtlas();
  if (!atlas) return null;
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

  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const loc = (name: string) => gl.getUniformLocation(prog, name);
  const uResolution = loc("u_resolution");
  const uTime = loc("u_time");
  const uPointer = loc("u_pointer");
  const rampLocs = ["u_bg", "u_head", "u_bright", "u_body", "u_dim"].map(loc);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  gl.uniform1i(loc("u_atlas"), 0);
  gl.uniform1f(loc("u_cell"), CELL_CSS_PX * dpr);
  gl.uniform1f(loc("u_pointerRadius"), POINTER_RADIUS_CSS_PX * dpr);
  gl.uniform1f(loc("u_density"), density);
  gl.uniform1f(loc("u_intensity"), intensity);

  // Palette: `ramp` is what's on screen, `target` is where it's heading.
  const ramp = themeRamp(themeKey);
  let target = themeRamp(themeKey);
  let blending = false;
  function uploadRamp() {
    rampLocs.forEach((l, i) => gl.uniform3fv(l, ramp.subarray(i * 3, i * 3 + 3)));
  }
  uploadRamp();

  const canvas = gl.canvas as HTMLCanvasElement;
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

  // Parked far off-screen until the pointer first moves.
  let pointerX = -1e5;
  let pointerY = -1e5;
  function onPointerMove(e: PointerEvent) {
    if (e.pointerType === "touch") return;
    pointerX = e.clientX * dpr;
    pointerY = e.clientY * dpr;
  }
  function onPointerLeave() {
    pointerX = pointerY = -1e5;
  }
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Start mid-storm so the very first frame already has streams on screen.
  const TIME_OFFSET = 40;
  const startTime = performance.now();
  let lastFrame = startTime;
  let rafId = 0;
  let running = true;

  function draw(now: number) {
    if (blending) {
      const k = reducedMotion ? 1 : 1 - Math.exp(-((now - lastFrame) / 1000) * THEME_BLEND_RATE);
      let remaining = 0;
      for (let i = 0; i < ramp.length; i++) {
        ramp[i] += (target[i] - ramp[i]) * k;
        remaining = Math.max(remaining, Math.abs(target[i] - ramp[i]));
      }
      if (remaining < 0.002) {
        ramp.set(target);
        blending = false;
      }
      uploadRamp();
    }
    lastFrame = now;
    gl.uniform1f(uTime, TIME_OFFSET + (reducedMotion ? 0 : (now - startTime) / 1000));
    gl.uniform2f(uPointer, pointerX, pointerY);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function frame() {
    if (!running) return;
    draw(performance.now());
    if (!reducedMotion) rafId = requestAnimationFrame(frame);
  }
  frame();

  function onResize() {
    resize();
    // The canvas clears on resize; a static scene needs repainting by hand.
    if (reducedMotion) draw(performance.now());
  }
  window.addEventListener("resize", onResize);

  function onVisibility() {
    if (document.hidden) {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    } else if (!reducedMotion) {
      running = true;
      lastFrame = performance.now();
      frame();
    }
  }
  document.addEventListener("visibilitychange", onVisibility);

  return {
    setTheme(key) {
      target = themeRamp(key);
      blending = true;
      if (reducedMotion) draw(performance.now());
    },
    cleanup() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteTexture(tex);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const expand = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(expand.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

/* ============================== 2D fallback ============================== */

function start2D(ctx: CanvasRenderingContext2D, themeKey: ThemeKey): RainHandle {
  const canvas = ctx.canvas;
  let t = THEMES[themeKey];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fontSize = CELL_CSS_PX;
  const trailCells = 26;
  let columns = 0;
  let drops: number[] = [];
  let speeds: number[] = [];
  let last = performance.now();

  function init() {
    columns = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: columns }, () => Math.random() * 60 - 20);
    speeds = Array.from({ length: columns }, () => 0.35 + Math.random() * 0.55);
  }

  let raf = 0;
  function draw() {
    const now = performance.now();
    const dt = Math.min((now - last) / 16, 2);
    last = now;
    // Glyphs re-roll a few times a second, not every frame.
    const tick = Math.floor(now / 220);

    ctx.globalAlpha = 1;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `600 ${fontSize - 3}px ${RAIN_FONT_STACK}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    for (let i = 0; i < columns; i++) {
      const x = i * fontSize;
      const head = Math.floor(drops[i]);

      for (let k = 0; k < trailCells; k++) {
        const row = head - k;
        const y = row * fontSize;
        if (y < -fontSize || y > canvas.height + fontSize) continue;

        const seed = (i * 1315423911 + row * 73856093 + tick * 19349663) >>> 0;
        const ch = RAIN_GLYPHS[seed % RAIN_GLYPHS.length];

        if (k === 0) {
          ctx.fillStyle = t.rainHead;
          ctx.globalAlpha = 0.95;
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
      if (drops[i] * fontSize > canvas.height + fontSize * trailCells) {
        drops[i] = -Math.random() * 35;
      }
    }

    if (!reducedMotion) raf = requestAnimationFrame(draw);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
    if (reducedMotion) draw();
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  init();
  window.addEventListener("resize", resize);

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

  return {
    setTheme(key) {
      t = THEMES[key];
      if (reducedMotion) draw();
    },
    cleanup() {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
