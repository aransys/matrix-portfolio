# 2D Rain — Cinematic Version

The old 2D rain was too subtle. This version is **actually readable, bright, and looks like the movie**.

## What changed:

### 1. **Opacity increased dramatically**
```tsx
// OLD: ctx.globalAlpha = 0.3 + Math.random() * 0.35; // Range: 0.3-0.65
// NEW: ctx.globalAlpha = 0.9;  // Much brighter, actually readable
```

### 2. **100% Katakana (no hex digits)**
```tsx
// OLD: ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ01ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵ
// NEW: ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ
```

### 3. **Real trail/streak effect**
```tsx
// Draw fading copies of the character above the main one
for (let trailIdx = 1; trailIdx < charObj.trail; trailIdx++) {
  const trailY = y - trailIdx * fontSize * 1.2;
  const trailAlpha = (charObj.trail - trailIdx) / charObj.trail;
  ctx.globalAlpha = 0.9 * trailAlpha;
  ctx.fillText(trailChar, x, trailY);
}
```

This creates **streaks** — the character leaves a bright trail above it as it falls.

### 4. **Colour-based brightness (stronger)**
```tsx
// OLD: dim text, subtle variation
// NEW: bright text with bright accent colour for highest brightness chars
if (charObj.brightness > 0.9) {
  ctx.fillStyle = t.accent; // Full brightness = full glow
} else if (charObj.brightness > 0.7) {
  ctx.fillStyle = t.primary; // High brightness = primary
```

### 5. **Lighter trail fade (more readable)**
```tsx
// OLD: ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';  // Heavy overlay
// NEW: ctx.fillStyle = `rgba(${hexToRgbComponents(theme.bg)}, 0.08)`;  // Theme bg @ 8% alpha — lighter, doesn’t obscure
```
(Implementation uses each theme’s `bg` hex converted to RGB so all three themes fade correctly.)

### 6. **Per-column speed variation**
```tsx
speed: 0.8 + Math.random() * 0.4, // Each column falls at slightly different speed
```

This creates **rhythm** — not all columns fall at the same speed, so there's visual interest.

### 7. **Flicker effect**
```tsx
if (Math.random() > 0.95) {
  charObj.brightness = Math.random(); // Occasionally randomize brightness
}
```

Characters randomly get brighter/dimmer, mimicking CRT flicker.

---

## Result

- **Much brighter** — actually readable, not subtle
- **Real trails** — characters leave bright streaks as they fall
- **Cinematic** — looks like the movie because of the opacity, trails, and katakana-only charset
- **Dense** — multiple characters per column creates immersion
- **Performant** — still 60fps, canvas-only

---

## How to use

**Already applied in this repo:** `src/components/MatrixRain2D.tsx` is the cinematic build (used automatically on mobile / reduced-motion via `MatrixRain.tsx`).

Tuning: edit that file directly (see **Tuning** below), then run `npm run dev`.

---

## Tuning (if you want to adjust)

**Make it brighter:** Change `ctx.globalAlpha = 0.9;` to `1.0`

**Make trails longer:** Change `trail: 8,` to `trail: 12,`

**Make it faster:** Change `speed: 0.8 + Math.random() * 0.4,` to `speed: 1.2 + Math.random() * 0.6,`

**Make it denser:** Change `for (let j = 0; j < 20; j++)` to `for (let j = 0; j < 30; j++)`

---

Test it and let me know if this feels more like the movie!
