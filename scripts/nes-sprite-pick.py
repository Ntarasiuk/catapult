#!/usr/bin/env python3
"""
Pull specific named metasprites from a NES CHR-ROM as standalone scaled PNGs
plus a JSON of ASCII renderings. Each entry in SPRITES is:
    name -> (top_left_tile, cols, rows, [optional flip])

Cell row stride is +0x10 (next CHR sheet row), col stride is +2 (next 8x16
vertical tile pair). This matches what the explorer revealed for Joust.

Usage:
  python3 scripts/nes-sprite-pick.py /path/to/Joust.nes
"""
import argparse
import json
import os
import sys

from PIL import Image, ImageOps, ImageDraw, ImageFont

PALETTE = [(34, 34, 34), (122, 122, 122), (200, 200, 200), (255, 255, 255)]


def parse_ines(path: str) -> bytes:
    with open(path, "rb") as f:
        data = f.read()
    if data[:4] != b"NES\x1a":
        raise SystemExit(f"{path}: not a valid iNES file")
    has_trainer = bool(data[6] & 0b00000100)
    header = 16
    trainer = 512 if has_trainer else 0
    prg_size = data[4] * 16 * 1024
    chr_size = data[5] * 8 * 1024
    chr_start = header + trainer + prg_size
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
    if idx * 16 + 16 > len(chr_data):
        return Image.new("RGB", (8, 8), (255, 0, 255))
    return decode_tile(chr_data[idx * 16 : idx * 16 + 16])


def render_metasprite(chr_data: bytes, top_left: int, cols: int, rows: int, layout: str = "row16") -> Image.Image:
    """Layouts:
       row16  — each metasprite row advances +0x10 in CHR, columns advance +2 (8x16 mode)
       seq    — tiles laid out sequentially: TL, TR, BL, BR ... in 8x16 pairs
    """
    img = Image.new("RGB", (cols * 8, rows * 16), (0, 0, 0))
    for r in range(rows):
        for c in range(cols):
            if layout == "row16":
                base = top_left + r * 0x10 + c * 2
            else:  # seq
                base = top_left + (r * cols + c) * 2
            top = get_tile(chr_data, base)
            bot = get_tile(chr_data, base + 1)
            img.paste(top, (c * 8, r * 16))
            img.paste(bot, (c * 8, r * 16 + 8))
    return img


# Best-guess named sprites from Joust CHR. Standing ostrich-knights live at
# $030-$046 (multiple animation frames), eggs around $0B0, font at $0C0+.
SPRITES = [
    # name,                   tl,    cols, rows, flip,  layout
    ("knight_a",              0x030, 2,    2,    False, "row16"),
    ("knight_b",              0x032, 2,    2,    False, "row16"),
    ("knight_c",              0x034, 2,    2,    False, "row16"),
    ("knight_d",              0x036, 2,    2,    False, "row16"),
    ("knight_e",              0x038, 2,    2,    False, "row16"),
    ("knight_f",              0x03A, 2,    2,    False, "row16"),
    ("knight_g",              0x040, 2,    2,    False, "row16"),
    ("knight_h",              0x042, 2,    2,    False, "row16"),
    ("knight_i",              0x044, 2,    2,    False, "row16"),
    ("knight_j",              0x046, 2,    2,    False, "row16"),
    ("knight_3w_a",           0x030, 3,    2,    False, "row16"),
    ("knight_3w_b",           0x036, 3,    2,    False, "row16"),
    ("knight_3w_c",           0x040, 3,    2,    False, "row16"),
    ("egg_a",                 0x0B0, 1,    1,    False, "row16"),
    ("egg_b",                 0x0B2, 1,    1,    False, "row16"),
    ("egg_c",                 0x0B4, 1,    1,    False, "row16"),
    ("egg_d",                 0x0B6, 1,    1,    False, "row16"),
]


def to_ascii(img: Image.Image, target_w: int, target_h: int, ramp: str = "@%#*+=-:. ") -> str:
    """Downsample img to (target_w, target_h*2) — extra vertical resolution
    is then averaged in pairs because monospace cells are ~2x taller than wide.
    """
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
            # 0=darkest -> ramp[0] (densest), 255=brightest -> ramp[last] (space)
            idx = int(round((lum / 255) * last))
            line.append(ramp[idx])
        rows_out.append("".join(line))
    return "\n".join(rows_out)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("rom")
    ap.add_argument("--ascii-w", type=int, default=8)
    ap.add_argument("--ascii-h", type=int, default=4)
    args = ap.parse_args()

    chr_data = parse_ines(args.rom)
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(here, "joust-sprites")
    os.makedirs(out_dir, exist_ok=True)

    contact_w = 12
    cells = []
    sprite_pngs = {}
    ascii_data = {}

    for name, tl, cw, ch, flip, layout in SPRITES:
        ms = render_metasprite(chr_data, tl, cw, ch, layout)
        if flip:
            ms = ImageOps.mirror(ms)
        # Save individual scaled PNG
        scaled = ms.resize((ms.size[0] * 6, ms.size[1] * 6), Image.NEAREST)
        out_png = os.path.join(out_dir, f"{name}.png")
        scaled.save(out_png)
        sprite_pngs[name] = out_png

        # Also store left-facing flipped variant
        ms_left = ImageOps.mirror(ms)
        scaled_left = ms_left.resize((ms.size[0] * 6, ms.size[1] * 6), Image.NEAREST)
        scaled_left.save(os.path.join(out_dir, f"{name}__flipped.png"))

        # ASCII renders — multiple sizes for selection
        sizes = [(args.ascii_w, args.ascii_h), (args.ascii_w + 2, args.ascii_h + 1)]
        ascii_variants = {}
        for tw, th in sizes:
            ascii_variants[f"{tw}x{th}"] = to_ascii(ms, tw, th)
            ascii_variants[f"{tw}x{th}_flipped"] = to_ascii(ms_left, tw, th)
        ascii_data[name] = {
            "tile_index": f"0x{tl:03X}",
            "size_tiles": [cw, ch],
            "size_pixels": [cw * 8, ch * 16],
            "ascii": ascii_variants,
        }
        cells.append((name, scaled))

    # Contact sheet PNG
    cell_w = max(c[1].size[0] for c in cells) + 8
    cell_h = max(c[1].size[1] for c in cells) + 26
    rows = (len(cells) + contact_w - 1) // contact_w
    sheet_w = contact_w * cell_w + 16
    sheet_h = rows * cell_h + 16
    sheet = Image.new("RGB", (sheet_w, sheet_h), (16, 16, 16))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 11)
    except OSError:
        font = ImageFont.load_default()
    for i, (name, img) in enumerate(cells):
        col = i % contact_w
        row = i // contact_w
        x = 8 + col * cell_w
        y = 8 + row * cell_h
        sheet.paste(img, (x, y))
        draw.text(
            (x, y + img.size[1] + 2),
            f"{name}",
            fill=(220, 220, 220),
            font=font,
        )
    contact_out = os.path.join(here, "Joust-named-sprites.png")
    sheet.save(contact_out)
    print(f"Wrote contact sheet: {contact_out}")

    # JSON
    json_out = os.path.join(here, "joust-sprites.json")
    with open(json_out, "w") as f:
        json.dump(ascii_data, f, indent=2)
    print(f"Wrote ASCII data: {json_out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
