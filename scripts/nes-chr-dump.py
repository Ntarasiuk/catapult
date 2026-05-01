#!/usr/bin/env python3
"""
Dump CHR-ROM tiles from an iNES (.nes) file as a tile-sheet PNG so we can
visually identify which tile indexes make up the ostrich sprite frames.

Usage:
  python3 scripts/nes-chr-dump.py /path/to/rom.nes [--scale 8] [--cols 16]

Output:
  scripts/<rom-stem>-chr.png   tile sheet, indexes labelled
  scripts/<rom-stem>-chr.txt   hex map of tile indexes
"""
import argparse
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# 2bpp NES palette -> grayscale levels
PALETTE = [(34, 34, 34), (122, 122, 122), (200, 200, 200), (255, 255, 255)]


def parse_ines(path: str):
    with open(path, "rb") as f:
        data = f.read()
    if data[:4] != b"NES\x1a":
        raise SystemExit(f"{path}: not a valid iNES file (bad magic)")
    prg_banks = data[4]
    chr_banks = data[5]
    flags6 = data[6]
    has_trainer = bool(flags6 & 0b00000100)
    header = 16
    trainer = 512 if has_trainer else 0
    prg_size = prg_banks * 16 * 1024
    chr_size = chr_banks * 8 * 1024
    chr_start = header + trainer + prg_size
    chr_data = data[chr_start : chr_start + chr_size]
    return {
        "prg_size": prg_size,
        "chr_size": chr_size,
        "chr_offset": chr_start,
        "chr_data": chr_data,
        "mapper": ((data[6] >> 4) | (data[7] & 0xF0)),
    }


def decode_tile(tile_bytes: bytes) -> Image.Image:
    """16 bytes -> 8x8 PIL image. NES 2bpp: plane 0 = first 8 bytes, plane 1 = next 8."""
    img = Image.new("RGB", (8, 8))
    px = img.load()
    for y in range(8):
        lo = tile_bytes[y]
        hi = tile_bytes[y + 8]
        for x in range(8):
            bit = 7 - x
            color = ((hi >> bit) & 1) << 1 | ((lo >> bit) & 1)
            px[x, y] = PALETTE[color]
    return img


def build_sheet(chr_data: bytes, cols: int, scale: int, label: bool) -> Image.Image:
    n_tiles = len(chr_data) // 16
    rows = (n_tiles + cols - 1) // cols
    label_h = 12 if label else 0
    cell_w = 8 * scale
    cell_h = 8 * scale + label_h
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), (16, 16, 16))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype(
            "/System/Library/Fonts/Menlo.ttc", 9
        )
    except OSError:
        font = ImageFont.load_default()
    for i in range(n_tiles):
        tile = decode_tile(chr_data[i * 16 : (i + 1) * 16])
        tile = tile.resize((8 * scale, 8 * scale), Image.NEAREST)
        col = i % cols
        row = i // cols
        x0 = col * cell_w
        y0 = row * cell_h
        sheet.paste(tile, (x0, y0))
        if label:
            draw.text(
                (x0 + 1, y0 + 8 * scale),
                f"{i:03X}",
                fill=(180, 180, 180),
                font=font,
            )
    return sheet


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("rom")
    ap.add_argument("--scale", type=int, default=6)
    ap.add_argument("--cols", type=int, default=16)
    ap.add_argument("--no-labels", action="store_true")
    args = ap.parse_args()

    info = parse_ines(args.rom)
    if not info["chr_data"]:
        print("ROM has no CHR-ROM (CHR-RAM cart). Need to run the emulator and dump VRAM instead.")
        return 2

    print(f"iNES: PRG {info['prg_size']} bytes, CHR {info['chr_size']} bytes, mapper {info['mapper']}")
    print(f"CHR starts at file offset {info['chr_offset']}")
    print(f"Tiles: {len(info['chr_data']) // 16}")

    here = os.path.dirname(os.path.abspath(__file__))
    stem = os.path.splitext(os.path.basename(args.rom))[0]
    out_png = os.path.join(here, f"{stem}-chr.png")
    sheet = build_sheet(
        info["chr_data"],
        cols=args.cols,
        scale=args.scale,
        label=not args.no_labels,
    )
    sheet.save(out_png)
    print(f"Wrote {out_png}  ({sheet.size[0]}×{sheet.size[1]})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
