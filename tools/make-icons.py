"""Generate the installable-app icon set for the 21N2 scoreboard.

Design: the 8-ball / cue-ball mark already used as the favicon - a white ball on
the near-black app background, so the icon matches the scoreboard UI.

Run:  c:/python314/python.exe tools/make-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
BG = (13, 14, 15, 255)      # --bg-dark-strip
BALL = (255, 255, 255, 255)
INK = (13, 14, 15, 255)

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\Arial.ttf",
]


def _font(px: int) -> ImageFont.FreeTypeFont:
    for candidate in FONT_CANDIDATES:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, px)
    return ImageFont.load_default()


def build(size: int, ball_ratio: float) -> Image.Image:
    """Render the ball mark. `ball_ratio` is the ball radius / canvas size."""
    # Supersample 4x then downscale for clean edges at 192/512 px.
    scale = 4
    px = size * scale
    img = Image.new("RGBA", (px, px), BG)
    draw = ImageDraw.Draw(img)

    cx = cy = px / 2
    radius = px * ball_ratio

    # Outer ring gives the mark definition on dark taskbars.
    ring = max(scale, int(px * 0.012))
    draw.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        fill=BALL,
        outline=BALL,
        width=ring,
    )

    # The "8" inside the ball.
    font = _font(int(radius * 1.25))
    left, top, right, bottom = draw.textbbox((0, 0), "8", font=font)
    draw.text(
        (cx - (right - left) / 2 - left, cy - (bottom - top) / 2 - top),
        "8",
        font=font,
        fill=INK,
    )

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    # "any" purpose: a slightly larger ball reads better in list views.
    build(192, 0.32).save(OUT / "icon-192.png")
    build(512, 0.32).save(OUT / "icon-512.png")
    # "maskable": keep the mark inside the 80% safe circle so Android can crop it.
    build(512, 0.22).save(OUT / "icon-maskable-512.png")
    # iOS ignores transparency, so flatten onto the app background.
    build(180, 0.30).convert("RGB").save(OUT / "apple-touch-icon.png")

    for path in sorted(OUT.glob("*.png")):
        print(f"{path.name:26} {path.stat().st_size / 1024:7.1f} KB")


if __name__ == "__main__":
    main()
