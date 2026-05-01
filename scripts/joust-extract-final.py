#!/usr/bin/env python3
"""
Extract authoritative Joust metasprites from CHR-ROM using OAM data captured
by running the ROM through jsnes (see /tmp/joust-re/analyze-joust.mjs).

Joust uses 8x8 sprite mode. Each metasprite below is a 2D grid of tile
indexes — left-to-right, top-to-bottom — directly observed in OAM.

Output:
  components/joust-sprites.json  ASCII strings keyed by sprite name
  scripts/joust-final.png        scaled PNG sheet for visual confirmation
"""
import json
import os

from PIL import Image, ImageOps, ImageDraw, ImageFont

PALETTE = [(0, 0, 0), (122, 122, 122), (200, 200, 200), (255, 255, 255)]


def parse_ines(path: str) -> bytes:
    with open(path, "rb") as f:
        data = f.read()
    has_trainer = bool(data[6] & 4)
    header = 16 + (512 if has_trainer else 0)
    prg_size = data[4] * 16 * 1024
    chr_size = data[5] * 8 * 1024
    chr_start = header + prg_size
    return data[chr_start : chr_start + chr_size]


def decode_tile(b: bytes) -> Image.Image:
    img = Image.new("RGB", (8, 8))
    px = img.load()
    for y in range(8):
        lo, hi = b[y], b[y + 8]
        for x in range(8):
            bit = 7 - x
            color = ((hi >> bit) & 1) << 1 | ((lo >> bit) & 1)
            px[x, y] = PALETTE[color]
    return img


def get_tile(chr_data: bytes, idx: int) -> Image.Image:
    return decode_tile(chr_data[idx * 16 : idx * 16 + 16])


def compose(chr_data: bytes, grid: list, hflip: bool = False) -> Image.Image:
    """grid is list of rows; each row is a list of tile indexes (or None for empty)."""
    rows = len(grid)
    cols = max(len(r) for r in grid)
    img = Image.new("RGB", (cols * 8, rows * 8), (0, 0, 0))
    for r, row in enumerate(grid):
        for c, idx in enumerate(row):
            if idx is None:
                continue
            tile = get_tile(chr_data, idx)
            img.paste(tile, (c * 8, r * 8))
    if hflip:
        img = ImageOps.mirror(img)
    return img


def to_ascii(img: Image.Image, target_w: int, target_h: int, ramp: str = " .:-=+*#%@") -> str:
    """Downsample to (target_w, target_h*2) and average pairs of rows so the
    output preserves aspect when monospace cells are ~2:1 tall:wide.
    Color 0 = black background -> space; brightest -> densest char."""
    sample = img.resize((target_w, target_h * 2), Image.LANCZOS).convert("L")
    pix = sample.load()
    last = len(ramp) - 1
    rows_out = []
    for ry in range(target_h):
        line = []
        for cx in range(target_w):
            a = pix[cx, ry * 2]
            b = pix[cx, ry * 2 + 1]
            lum = (a + b) // 2
            # Brightest -> densest char (so the lit sprite reads as dark ink on the light bone bg)
            idx = int(round((lum / 255) * last))
            line.append(ramp[idx])
        rows_out.append("".join(line))
    return "\n".join(rows_out)


# Authoritative metasprite definitions from in-emulator OAM dumps.
# Layout: rows top-to-bottom, columns left-to-right. Tiles are CHR indexes.
SPRITES = {
    # Player ostrich-knight, flying pose (16x24, 2 cols x 3 rows)
    "player_fly": [
        [0x08, 0x09],
        [0x0A, 0x0B],
        [0x0C, 0x0D],
    ],
    # Player ostrich-knight, standing pose A (16x24)
    "player_stand_a": [
        [0x54, 0x55],
        [0x62, 0x63],
        [0x64, 0x65],
    ],
    # Player ostrich-knight, standing pose B (animation frame 2)
    "player_stand_b": [
        [0x54, 0x55],
        [0x68, 0x69],
        [0x6A, 0x6B],
    ],
    # Buzzard (enemy mount), flying pose A (16x16, 2 cols x 2 rows)
    "buzzard_fly_a": [
        [0x4C, 0x4D],
        [0x4E, 0x4F],
    ],
    # Buzzard, flying pose B
    "buzzard_fly_b": [
        [0x50, 0x51],
        [0x52, 0x53],
    ],
}

# ASCII output sizes — generous detail; game grid will be widened and font shrunk.
ASCII_SIZES = {
    # name             cols  rows
    "player_fly":      (12,   9),
    "player_stand_a":  (12,   9),
    "player_stand_b":  (12,   9),
    "buzzard_fly_a":   (12,   6),
    "buzzard_fly_b":   (12,   6),
}


def main() -> int:
    rom = "/Users/nathantarasiuk/Downloads/Joust.nes"
    chr_data = parse_ines(rom)
    here = os.path.dirname(os.path.abspath(__file__))

    out = {}
    sprite_imgs = []
    for name, grid in SPRITES.items():
        right_img = compose(chr_data, grid, hflip=False)
        left_img = compose(chr_data, grid, hflip=True)
        tw, th = ASCII_SIZES[name]
        out[name + "_right"] = to_ascii(right_img, tw, th)
        out[name + "_left"]  = to_ascii(left_img, tw, th)
        sprite_imgs.append((name + " (R)", right_img))
        sprite_imgs.append((name + " (L)", left_img))

    # Write JSON
    json_path = os.path.join(
        os.path.dirname(here), "components", "joust-sprites.json"
    )
    with open(json_path, "w") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {json_path}")

    # Visual confirmation sheet
    cols = 4
    cell_w = 16 * 6 + 16  # scaled 6x, padded
    cell_h = 24 * 6 + 28
    rows_n = (len(sprite_imgs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell_w + 16, rows_n * cell_h + 16), (16, 16, 16))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 11)
    except OSError:
        font = ImageFont.load_default()
    for i, (label, img) in enumerate(sprite_imgs):
        col = i % cols
        row = i // cols
        x = 8 + col * cell_w
        y = 8 + row * cell_h
        scaled = img.resize((img.size[0] * 6, img.size[1] * 6), Image.NEAREST)
        sheet.paste(scaled, (x, y))
        draw.text((x, y + scaled.size[1] + 4), label, fill=(220, 220, 220), font=font)
    png_path = os.path.join(here, "joust-final.png")
    sheet.save(png_path)
    print(f"Wrote {png_path}")

    print()
    print("Preview:")
    for k in ["player_fly_right", "player_stand_a_right", "buzzard_fly_a_right"]:
        print(f"\n=== {k} ===")
        print(out[k])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
