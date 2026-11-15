import { useEffect, useRef } from "react";
import { RAIN_FONT_STACK, RAIN_GLYPHS } from "../config/glyphs";
import { RAIN_BEND_EVENT } from "../trail/eggBridge";
import type { ThemeKey } from "../config/themes";
import { THEMES, THEME_ORDER } from "../config/themes";

export interface MatrixRainProps {
  theme: ThemeKey;
  /** Share of columns carrying a stream (0–1). Lower = sparser rain. */
  density?: number;
  /** Overall brightness multiplier for the rain. */
  intensity?: number;
  /**
   * Where a theme change sweeps in from: the theme switcher (a deliberate
   * choice), or the bottom / top edge when the page changed theme because
   * the visitor scrolled down / up into a new chapter.
   */
  waveFrom?: WaveSource;
}

export type WaveSource = "switcher" | "below" | "above";

/** A running renderer. `setTheme` recolours it without restarting. */
interface RainHandle {
  setTheme: (key: ThemeKey, from: WaveSource) => void;
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
 *     falling. In WebGL the new palette sweeps out from the theme switcher
 *     as a wave, and now and then a stream falls in another theme's colour.
 */
export function MatrixRain({
  theme,
  density = 0.6,
  intensity = 0.7,
  waveFrom = "switcher",
}: MatrixRainProps) {
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
    handleRef.current?.setTheme(theme, waveFrom);
    // waveFrom only describes the change it arrives with; on its own it
    // must not start a wave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
 *   - Two palettes are live at once: a theme change is a wavefront
 *     spreading from a point, old colour ahead of it and new behind.
 *   - A small share of streams fall in one of the other themes' colours.
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
uniform float u_bend;
// Palettes are [bg, head, bright, body, dim]. u_from is ahead of the
// wavefront, u_to behind it; u_wave runs 0 -> 1 as the front crosses.
uniform vec3 u_from[5];
uniform vec3 u_to[5];
uniform float u_wave;
uniform vec2 u_waveOrigin;
// Distance from the origin to the screen: the front starts there, so a
// wave that begins off-screen is visible from its first frame.
uniform float u_waveNear;
// The other two themes, [head, bright, body, dim] each, for stray streams.
uniform vec3 u_stray[8];

const float ATLAS_GRID = 8.0;
/** Share of streams that fall in another theme's colour. */
const float STRAY_SHARE = 0.035;

/** 0 ahead of the theme wavefront, 1 behind it. Set once per pixel. */
float g_wave;

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

  // Which palette this stream falls in. Every cell of one pass down the
  // screen shares a pass number, so a stray keeps its colour from the top
  // of the screen to the bottom, then the column rolls again.
  float pass = floor((u_time * speed - seed * 200.0 - row) / numRows);
  vec3 head, bright, body, dimc;
  if (hash21(vec2(col + depth * 31.0, pass)) > 1.0 - STRAY_SHARE) {
    int k = hash21(vec2(pass, col + 7.0)) > 0.5 ? 4 : 0;
    head = u_stray[k];
    bright = u_stray[k + 1];
    body = u_stray[k + 2];
    dimc = u_stray[k + 3];
  } else {
    head = mix(u_from[1], u_to[1], g_wave);
    bright = mix(u_from[2], u_to[2], g_wave);
    body = mix(u_from[3], u_to[3], g_wave);
    dimc = mix(u_from[4], u_to[4], g_wave);
  }

  // Distance-to-head colour ramp
  vec3 c;
  if (dist < 1.0) {
    c = head;
  } else if (dist < 2.5) {
    c = mix(bright, head, 1.0 - smoothstep(1.0, 2.5, dist));
  } else if (dist < 8.0) {
    c = mix(body, bright, exp(-(dist - 2.5) * 0.35));
  } else {
    c = mix(dimc, body, exp(-(dist - 8.0) * 0.18));
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
  vec2 screen = px;

  // "There is no spoon": a lens that bends the code around the pointer
  // and, above half strength, a slow waver through the whole field.
  float lens = min(u_bend * 2.0, 1.0);
  float waver = max(u_bend - 0.5, 0.0) * 2.0;
  vec2 toPointer = px - u_pointer;
  float lensDist = length(toPointer) / (u_pointerRadius * 1.5);
  px -= toPointer * 0.55 * lens * exp(-lensDist * lensDist);
  px.x += waver * u_cell * 1.6 * sin(px.y / (u_cell * 9.0) + u_time * 1.3);

  // Theme wave: a soft-edged front spreading from its origin until it has
  // passed the farthest corner of the screen.
  float reach = length(max(abs(u_waveOrigin), abs(u_resolution - u_waveOrigin)));
  float band = u_resolution.y * 0.3;
  float front = u_waveNear + u_wave * (reach + band - u_waveNear);
  float fromOrigin = distance(screen, u_waveOrigin);
  g_wave = 1.0 - smoothstep(front - band, front, fromOrigin);
  // The front itself runs hot for a moment as it passes.
  float crest = (fromOrigin - (front - band * 0.5)) / (band * 0.3);
  float surge = exp(-crest * crest) * step(0.001, u_wave) * step(u_wave, 0.999);

  vec3 rain = layer(px + vec2(u_cell * 0.37, 0.0), 1.0) * 0.5; // back
  rain += layer(px, 0.0);                                        // front

  // Soft pool of brighter code around the pointer
  float d = distance(screen, u_pointer) / u_pointerRadius;
  rain *= 1.0 + 1.1 * exp(-d * d);
  rain *= 1.0 + 0.6 * surge;

  // Cheap vignette
  float vig = smoothstep(1.2, 0.35, length(v_uv - 0.5));
  frag = vec4((mix(u_from[0], u_to[0], g_wave) + rain) * mix(0.55, 1.0, vig), 1.0);
}
`;

/** How quickly the finale's bend eases in and out, per second. */
const BEND_RATE = 1.6;

/** Front-layer cell size in CSS pixels. */
const CELL_CSS_PX = 18;
/** Radius of the pointer highlight in CSS pixels. */
const POINTER_RADIUS_CSS_PX = 170;
/** How long a theme change takes to sweep across the screen. */
const THEME_WAVE_MS = 1500;

const RAMP_KEYS = ["bg", "rainHead", "rainBright", "rainBody", "rainDim"] as const;

function themeRamp(key: ThemeKey): Float32Array<ArrayBuffer> {
  const t = THEMES[key];
  const out = new Float32Array(RAMP_KEYS.length * 3);
  RAMP_KEYS.forEach((k, i) => out.set(hexToRgb(t[k]), i * 3));
  return out;
}

/** [head, bright, body, dim] for each theme other than `key`. */
function strayRamps(key: ThemeKey): Float32Array<ArrayBuffer> {
  const out = new Float32Array(8 * 3);
  THEME_ORDER.filter((k) => k !== key)
    .slice(0, 2)
    .forEach((other, i) => out.set(themeRamp(other).subarray(3), i * 12));
  return out;
}

/** How far off-screen a scroll-driven wave starts, in screen heights. A
 *  distant origin makes the front nearly flat, like a tide line. */
const SCROLL_WAVE_DISTANCE = 1.4;

/** Where a theme wave starts, and how far that is from the screen. */
function waveOrigin(from: WaveSource, dpr: number): { x: number; y: number; near: number } {
  const w = window.innerWidth * dpr;
  const h = window.innerHeight * dpr;
  if (from === "below") return { x: w / 2, y: h * (1 + SCROLL_WAVE_DISTANCE), near: h * SCROLL_WAVE_DISTANCE };
  if (from === "above") return { x: w / 2, y: -h * SCROLL_WAVE_DISTANCE, near: h * SCROLL_WAVE_DISTANCE };
  const el = document.querySelector('[role="radiogroup"][aria-label="Colour theme"]');
  if (!el) return { x: w / 2, y: 0, near: 0 };
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2) * dpr, y: (r.top + r.height / 2) * dpr, near: 0 };
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
  const uBend = loc("u_bend");
  const uFrom = loc("u_from");
  const uTo = loc("u_to");
  const uWave = loc("u_wave");
  const uWaveOrigin = loc("u_waveOrigin");
  const uWaveNear = loc("u_waveNear");
  const uStray = loc("u_stray");

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  gl.uniform1i(loc("u_atlas"), 0);
  gl.uniform1f(loc("u_cell"), CELL_CSS_PX * dpr);
  gl.uniform1f(loc("u_pointerRadius"), POINTER_RADIUS_CSS_PX * dpr);
  gl.uniform1f(loc("u_density"), density);
  gl.uniform1f(loc("u_intensity"), intensity);

  // Palette: `from` is ahead of the wavefront, `to` behind it. At rest
  // the wave is complete and the whole screen shows `to`.
  let from = themeRamp(themeKey);
  let to = themeRamp(themeKey);
  let current = themeKey;
  let wave = 1;
  let waveStart = 0;
  function uploadPalette() {
    gl.uniform3fv(uFrom, from);
    gl.uniform3fv(uTo, to);
    gl.uniform3fv(uStray, strayRamps(current));
  }
  uploadPalette();
  gl.uniform1f(uWave, wave);
  gl.uniform2f(uWaveOrigin, 0, 0);
  gl.uniform1f(uWaveNear, 0);

  const canvas = gl.canvas as HTMLCanvasElement;
  function resize() {
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    // Always, not only when the size changed: a renderer started on a
    // canvas that is already the right size (a remount) still has a fresh
    // program whose resolution is zero, which draws nothing at all.
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uResolution, w, h);
  }
  resize();

  // Lens strength for the trail's finale, eased towards its target.
  let bend = 0;
  let bendTarget = 0;

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
    if (wave < 1) {
      const t = reducedMotion ? 1 : Math.min(1, (now - waveStart) / THEME_WAVE_MS);
      // Ease out: the front leaves the switcher fast and settles gently.
      wave = 1 - Math.pow(1 - t, 1.8);
      if (t >= 1) wave = 1;
      gl.uniform1f(uWave, wave);
    }
    bend = reducedMotion
      ? bendTarget
      : bend + (bendTarget - bend) * (1 - Math.exp(-((now - lastFrame) / 1000) * BEND_RATE));
    gl.uniform1f(uBend, bend);
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

  const onBend = (e: Event) => {
    bendTarget = (e as CustomEvent<number>).detail;
    if (reducedMotion) draw(performance.now());
  };
  window.addEventListener(RAIN_BEND_EVENT, onBend);

  /** Start a wave towards `key`'s palette. */
  function recolour(key: ThemeKey, source: WaveSource) {
    if (key === current) return;
    // Interrupted mid-wave: carry on from roughly what is on screen.
    if (wave < 1) {
      const mixed = new Float32Array(from.length);
      for (let i = 0; i < mixed.length; i++) mixed[i] = from[i] + (to[i] - from[i]) * wave;
      from = mixed;
    } else {
      from = to;
    }
    to = themeRamp(key);
    current = key;
    wave = 0;
    waveStart = performance.now();
    uploadPalette();
    gl.uniform1f(uWave, 0);
    const origin = waveOrigin(source, dpr);
    gl.uniform2f(uWaveOrigin, origin.x, origin.y);
    gl.uniform1f(uWaveNear, origin.near);
    if (reducedMotion) draw(performance.now());
  }

  return {
    setTheme: recolour,
    cleanup() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener(RAIN_BEND_EVENT, onBend);
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
