/**
 * Glyph pool shared by the background rain and the hero's name-resolve
 * intro: full-width katakana (they fill a square cell), digits, and a few
 * symbols. Exactly 64 entries so the WebGL atlas is a clean 8×8 grid.
 */
export const RAIN_GLYPHS = Array.from(
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
    "0123456789" +
    "Z:・=*+<>",
);

/** Font stack with katakana coverage on macOS, Windows, Android and Linux. */
export const RAIN_FONT_STACK =
  '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", "Noto Sans CJK JP", "MS Gothic", monospace';
