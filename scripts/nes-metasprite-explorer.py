#!/usr/bin/env python3
"""
Render contact sheets of candidate metasprite groupings from a NES CHR-ROM.
Joust on NES uses 8x16 sprite mode (very likely), so the natural unit is
a tile *pair* — tile N (top half) + tile N+1 (bottom half) = one 8x16 sprite.

For each metasprite size (cols × rows of 8x16 sprites), we render a contact
sheet showing the metasprite at every plausible top-left starting tile.

Usage:
  python3 scripts/nes-metasprite-explorer.py /path/to/rom.nes
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFont

PALETTE = [(34, 34, 34), (122, 122, 122), (200, 200, 200), (255, 255, 255)]


def parse_ines(path: str):
    with open(path, "rb") as f:
        data = f.read()
    if data[:4] != b"NES\x1a":
        raise SystemExit(f"{path}: not a valid iNES file")
    prg_banks = data[4]
    chr_banks = data[5]
    has_trainer = bool(data[6] & 0b00000100)
    header = 16
    trainer = 512 if has_trainer else 0
    prg_size = prg_banks * 16 * 1024
    chr_size = chr_banks * 8 * 1024
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


def render_metasprite_8x16(chr_data: bytes, top_left: int, cols: int, rows: int) -> Image.Image:
    """In 8x16 mode, each (col,row) cell is composed of two stacked 8x8 tiles
    starting at top_left + col*2 + row*0x10. We index them sequentially: each
    column of the metasprite is two tile indexes (top, bottom), each row of
    metasprite cells advances by 0x10 in the tile sheet (next sheet row)."""
    w, h = cols * 8, rows * 16
    img = Image.new("RGB", (w, h), (0, 0, 0))
    for r in range(rows):
        for c in range(cols):
            base = top_left + r * 0x10 + c * 2
            top = get_tile(chr_data, base)
            bot = get_tile(chr_data, base + 1)
            img.paste(top, (c * 8, r * 16))
            img.paste(bot, (c * 8, r * 16 + 8))
    return img


def render_metasprite_8x8(chr_data: bytes, top_left: int, cols: int, rows: int) -> Image.Image:
    """Fallback: treat tiles as 8x8 in standard sequential layout (16 tiles per row)."""
    w, h = cols * 8, rows * 8
    img = Image.new("RGB", (w, h), (0, 0, 0))
    for r in range(rows):
        for c in range(cols):
            t = top_left + r * 0x10 + c
            img.paste(get_tile(chr_data, t), (c * 8, r * 8))
    return img


def make_contact_sheet(
    chr_data: bytes,
    label: str,
    candidates: list,
    metasprite_w: int,
    metasprite_h: int,
    scale: int,
    columns: int = 8,
) -> Image.Image:
    cell_w = metasprite_w * scale
    cell_h = metasprite_h * scale
    label_h = 14
    rows = (len(candidates) + columns - 1) // columns
    sheet = Image.new(
        "RGB",
        (columns * (cell_w + 8) + 8, rows * (cell_h + label_h + 8) + 30),
        (16, 16, 16),
    )
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 11)
        title_font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 14)
    except OSError:
        font = title_font = ImageFont.load_default()
    draw.text((8, 6), label, fill=(220, 220, 220), font=title_font)
    for i, (top_left, ms) in enumerate(candidates):
        col = i % columns
        row = i // columns
        x0 = 8 + col * (cell_w + 8)
        y0 = 30 + row * (cell_h + label_h + 8)
        scaled = ms.resize((cell_w, cell_h), Image.NEAREST)
        sheet.paste(scaled, (x0, y0))
        draw.text(
            (x0 + 2, y0 + cell_h),
            f"${top_left:03X}",
            fill=(180, 180, 180),
            font=font,
        )
    return sheet


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("rom")
    ap.add_argument("--start", type=lambda s: int(s, 0), default=0x000)
    ap.add_argument("--end", type=lambda s: int(s, 0), default=0x0E0)
    args = ap.parse_args()

    chr_data = parse_ines(args.rom)
    if not chr_data:
        print("ROM has no CHR-ROM (CHR-RAM cartridge).")
        return 2
    print(f"CHR: {len(chr_data)} bytes ({len(chr_data) // 16} tiles)")

    here = os.path.dirname(os.path.abspath(__file__))
    stem = os.path.splitext(os.path.basename(args.rom))[0]

    # Three contact sheets: 8x16 single sprite, 2x1 metasprite (16x16), 2x2 metasprite (16x32)
    configs = [
        # (label, cols, rows, mode, step)
        ("8x16 single sprites (vertical pair)",     1, 1, "8x16", 2),
        ("2x1 metasprite (16x16) — knight figure",  2, 1, "8x16", 2),
        ("2x2 metasprite (16x32) — tall figure",    2, 2, "8x16", 2),
        ("3x2 metasprite (24x32) — wide bird",      3, 2, "8x16", 2),
    ]

    for label, cw, ch, mode, step in configs:
        candidates = []
        for tl in range(args.start, args.end, step):
            ms = render_metasprite_8x16(chr_data, tl, cw, ch)
            candidates.append((tl, ms))
        # Filter out completely-black candidates (likely empty tile regions)
        non_empty = []
        for tl, ms in candidates:
            extrema = ms.convert("L").getextrema()
            if extrema[1] > 20:  # has some non-black content
                non_empty.append((tl, ms))
        sheet = make_contact_sheet(
            chr_data,
            f"{label}  ({len(non_empty)} non-empty of {len(candidates)})",
            non_empty,
            cw * 8,
            ch * 16,
            scale=4,
            columns=12,
        )
        out = os.path.join(here, f"{stem}-meta-{cw}x{ch}.png")
        sheet.save(out)
        print(f"  wrote {out}  ({sheet.size[0]}x{sheet.size[1]})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
