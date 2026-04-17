"""Generate a 1200x630 Matrix-themed Open Graph preview image.

Run from the project root:

    python3 scripts/gen_og_image.py

Writes `public/og-image.png`. Re-run after changing OWNER / tagline.
"""

from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
OUT = Path(__file__).resolve().parents[1] / "public" / "og-image.png"

BG = (8, 10, 8)
GREEN = (0, 255, 65)
GREEN_DIM = (0, 170, 42)
GREEN_DEEP = (0, 90, 25)
WHITE = (230, 255, 235)
DIM_TEXT = (120, 180, 135)

FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

# We'd love katakana here, but the sandbox has no CJK font available.
# Hex + symbols renders crisp in every glyph and still reads "digital rain".
KATAKANA = "0123456789ABCDEF<>/\\|{}[]#$%&*+-=?!"


def matrix_rain(img: Image.Image) -> None:
    """Draw faint vertical katakana columns with a brighter head character."""
    draw = ImageDraw.Draw(img)
    font_small = ImageFont.truetype(FONT_BOLD, 22)
    rng = random.Random(42)
    col_w = 26
    for x in range(0, W, col_w):
        # Not every column — gives the rain more negative space
        if rng.random() < 0.35:
            continue
        length = rng.randint(6, 22)
        y_top = rng.randint(-200, H - 40)
        for i in range(length):
            ch = rng.choice(KATAKANA)
            y = y_top + i * 26
            if y < -26 or y > H:
                continue
            if i == length - 1:
                color = WHITE
            elif i >= length - 3:
                color = GREEN
            else:
                # Fade toward the top of the streak
                fade = max(0.12, 1 - (length - i) / length)
                color = tuple(int(c * fade) for c in GREEN_DIM)
            draw.text((x, y), ch, font=font_small, fill=color)


def vignette(img: Image.Image) -> Image.Image:
    """Darken the edges so the centered headline pops."""
    mask = Image.new("L", (W, H), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.ellipse((-W // 3, -H // 3, W + W // 3, H + H // 3), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(180))
    black = Image.new("RGB", (W, H), (0, 0, 0))
    return Image.composite(img, black, mask)


def draw_centered(draw: ImageDraw.ImageDraw, text: str, y: int, font, fill) -> None:
    tw = draw.textlength(text, font=font)
    draw.text(((W - tw) / 2, y), text, font=font, fill=fill)


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    matrix_rain(img)
    img = vignette(img)

    draw = ImageDraw.Draw(img, "RGBA")

    # Center panel
    panel = (80, 180, W - 80, H - 140)
    draw.rectangle(panel, fill=(10, 22, 14, 180), outline=None)
    draw.rectangle(panel, outline=GREEN_DEEP, width=2)

    # Tag above headline, small caps spacing
    font_tag = ImageFont.truetype(FONT_REG, 22)
    draw_centered(draw, "// 00  TRANSMISSION OPEN", 215, font_tag, GREEN_DIM)

    # Headline — name
    font_name = ImageFont.truetype(FONT_BOLD, 88)
    draw_centered(draw, "AURIMAS RANSYS", 260, font_name, GREEN)

    # Sub headline — role
    font_role = ImageFont.truetype(FONT_REG, 38)
    draw_centered(draw, "> full_stack_developer", 370, font_role, WHITE)

    # Footer strip: stack + URL
    font_foot = ImageFont.truetype(FONT_REG, 24)
    draw_centered(
        draw,
        "Django  ·  Python  ·  TypeScript  ·  React",
        445,
        font_foot,
        DIM_TEXT,
    )
    draw_centered(draw, "ransys.dev", 505, font_foot, GREEN_DIM)

    # Soft green glow on the name — render to a separate layer and blur
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    tw = gdraw.textlength("AURIMAS RANSYS", font=font_name)
    gdraw.text(
        ((W - tw) / 2, 260),
        "AURIMAS RANSYS",
        font=font_name,
        fill=(*GREEN, 120),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    img.paste(glow, (0, 0), glow)
    # Re-render the crisp name on top of its glow
    draw.text(((W - tw) / 2, 260), "AURIMAS RANSYS", font=font_name, fill=GREEN)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
