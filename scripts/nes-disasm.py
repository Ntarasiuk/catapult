#!/usr/bin/env python3
"""
6502 disassembler for NES iNES ROMs (NROM-128 / NROM-256, mapper 0).
Produces a labelled .asm with addresses, opcodes, immediate operands, and
auto-generated labels at branch / JSR / JMP targets within PRG.

Also dumps:
  - Reset / NMI / IRQ vector targets
  - All "LDA #imm" with immediate value (for finding physics constants)
  - All STA $4014 occurrences (OAM DMA — used to find sprite render code)
  - All LDA $4016/$4017 occurrences (controller reads — finds input handler)
"""
import argparse
import collections
import os
import sys

# Opcode table: opcode -> (mnemonic, addr_mode, length)
# addr_mode: imp, imm, zp, zpx, zpy, abs, absx, absy, ind, indx, indy, rel, accum
OPCODES = {}
def op(c, m, a, l): OPCODES[c] = (m, a, l)

# ADC
op(0x69,'ADC','imm',2);op(0x65,'ADC','zp',2);op(0x75,'ADC','zpx',2);op(0x6D,'ADC','abs',3)
op(0x7D,'ADC','absx',3);op(0x79,'ADC','absy',3);op(0x61,'ADC','indx',2);op(0x71,'ADC','indy',2)
# AND
op(0x29,'AND','imm',2);op(0x25,'AND','zp',2);op(0x35,'AND','zpx',2);op(0x2D,'AND','abs',3)
op(0x3D,'AND','absx',3);op(0x39,'AND','absy',3);op(0x21,'AND','indx',2);op(0x31,'AND','indy',2)
# ASL
op(0x0A,'ASL','accum',1);op(0x06,'ASL','zp',2);op(0x16,'ASL','zpx',2);op(0x0E,'ASL','abs',3);op(0x1E,'ASL','absx',3)
# Branches (relative)
for c,m in [(0x10,'BPL'),(0x30,'BMI'),(0x50,'BVC'),(0x70,'BVS'),
            (0x90,'BCC'),(0xB0,'BCS'),(0xD0,'BNE'),(0xF0,'BEQ')]: op(c,m,'rel',2)
# BIT
op(0x24,'BIT','zp',2);op(0x2C,'BIT','abs',3)
# BRK
op(0x00,'BRK','imp',1)
# Compare
op(0xC9,'CMP','imm',2);op(0xC5,'CMP','zp',2);op(0xD5,'CMP','zpx',2);op(0xCD,'CMP','abs',3)
op(0xDD,'CMP','absx',3);op(0xD9,'CMP','absy',3);op(0xC1,'CMP','indx',2);op(0xD1,'CMP','indy',2)
op(0xE0,'CPX','imm',2);op(0xE4,'CPX','zp',2);op(0xEC,'CPX','abs',3)
op(0xC0,'CPY','imm',2);op(0xC4,'CPY','zp',2);op(0xCC,'CPY','abs',3)
# DEC/INC
op(0xC6,'DEC','zp',2);op(0xD6,'DEC','zpx',2);op(0xCE,'DEC','abs',3);op(0xDE,'DEC','absx',3)
op(0xCA,'DEX','imp',1);op(0x88,'DEY','imp',1)
op(0xE6,'INC','zp',2);op(0xF6,'INC','zpx',2);op(0xEE,'INC','abs',3);op(0xFE,'INC','absx',3)
op(0xE8,'INX','imp',1);op(0xC8,'INY','imp',1)
# EOR
op(0x49,'EOR','imm',2);op(0x45,'EOR','zp',2);op(0x55,'EOR','zpx',2);op(0x4D,'EOR','abs',3)
op(0x5D,'EOR','absx',3);op(0x59,'EOR','absy',3);op(0x41,'EOR','indx',2);op(0x51,'EOR','indy',2)
# Flags
op(0x18,'CLC','imp',1);op(0x38,'SEC','imp',1);op(0x58,'CLI','imp',1);op(0x78,'SEI','imp',1)
op(0xB8,'CLV','imp',1);op(0xD8,'CLD','imp',1);op(0xF8,'SED','imp',1)
# Jumps / subroutine
op(0x4C,'JMP','abs',3);op(0x6C,'JMP','ind',3)
op(0x20,'JSR','abs',3);op(0x60,'RTS','imp',1);op(0x40,'RTI','imp',1)
# Loads
op(0xA9,'LDA','imm',2);op(0xA5,'LDA','zp',2);op(0xB5,'LDA','zpx',2);op(0xAD,'LDA','abs',3)
op(0xBD,'LDA','absx',3);op(0xB9,'LDA','absy',3);op(0xA1,'LDA','indx',2);op(0xB1,'LDA','indy',2)
op(0xA2,'LDX','imm',2);op(0xA6,'LDX','zp',2);op(0xB6,'LDX','zpy',2);op(0xAE,'LDX','abs',3);op(0xBE,'LDX','absy',3)
op(0xA0,'LDY','imm',2);op(0xA4,'LDY','zp',2);op(0xB4,'LDY','zpx',2);op(0xAC,'LDY','abs',3);op(0xBC,'LDY','absx',3)
# LSR
op(0x4A,'LSR','accum',1);op(0x46,'LSR','zp',2);op(0x56,'LSR','zpx',2);op(0x4E,'LSR','abs',3);op(0x5E,'LSR','absx',3)
# NOP
op(0xEA,'NOP','imp',1)
# ORA
op(0x09,'ORA','imm',2);op(0x05,'ORA','zp',2);op(0x15,'ORA','zpx',2);op(0x0D,'ORA','abs',3)
op(0x1D,'ORA','absx',3);op(0x19,'ORA','absy',3);op(0x01,'ORA','indx',2);op(0x11,'ORA','indy',2)
# Stack
op(0x48,'PHA','imp',1);op(0x68,'PLA','imp',1);op(0x08,'PHP','imp',1);op(0x28,'PLP','imp',1)
op(0xBA,'TSX','imp',1);op(0x9A,'TXS','imp',1)
# Rotate
op(0x2A,'ROL','accum',1);op(0x26,'ROL','zp',2);op(0x36,'ROL','zpx',2);op(0x2E,'ROL','abs',3);op(0x3E,'ROL','absx',3)
op(0x6A,'ROR','accum',1);op(0x66,'ROR','zp',2);op(0x76,'ROR','zpx',2);op(0x6E,'ROR','abs',3);op(0x7E,'ROR','absx',3)
# SBC
op(0xE9,'SBC','imm',2);op(0xE5,'SBC','zp',2);op(0xF5,'SBC','zpx',2);op(0xED,'SBC','abs',3)
op(0xFD,'SBC','absx',3);op(0xF9,'SBC','absy',3);op(0xE1,'SBC','indx',2);op(0xF1,'SBC','indy',2)
# Stores
op(0x85,'STA','zp',2);op(0x95,'STA','zpx',2);op(0x8D,'STA','abs',3);op(0x9D,'STA','absx',3)
op(0x99,'STA','absy',3);op(0x81,'STA','indx',2);op(0x91,'STA','indy',2)
op(0x86,'STX','zp',2);op(0x96,'STX','zpy',2);op(0x8E,'STX','abs',3)
op(0x84,'STY','zp',2);op(0x94,'STY','zpx',2);op(0x8C,'STY','abs',3)
# Transfers
op(0xAA,'TAX','imp',1);op(0x8A,'TXA','imp',1);op(0xA8,'TAY','imp',1);op(0x98,'TYA','imp',1)


def fmt_operand(mode, lo, hi, pc):
    if mode == 'imp':   return ''
    if mode == 'accum': return 'A'
    if mode == 'imm':   return f'#${lo:02X}'
    if mode == 'zp':    return f'${lo:02X}'
    if mode == 'zpx':   return f'${lo:02X},X'
    if mode == 'zpy':   return f'${lo:02X},Y'
    if mode == 'abs':   return f'${hi:02X}{lo:02X}'
    if mode == 'absx':  return f'${hi:02X}{lo:02X},X'
    if mode == 'absy':  return f'${hi:02X}{lo:02X},Y'
    if mode == 'ind':   return f'(${hi:02X}{lo:02X})'
    if mode == 'indx':  return f'(${lo:02X},X)'
    if mode == 'indy':  return f'(${lo:02X}),Y'
    if mode == 'rel':
        offset = lo if lo < 0x80 else lo - 0x100
        target = (pc + 2 + offset) & 0xFFFF
        return f'${target:04X}'
    return '?'


def target_addr(opcode, mode, lo, hi, pc):
    if mode == 'rel':
        offset = lo if lo < 0x80 else lo - 0x100
        return (pc + 2 + offset) & 0xFFFF
    if mode == 'abs' and OPCODES[opcode][0] in ('JMP', 'JSR'):
        return (hi << 8) | lo
    return None


def parse_ines(path):
    with open(path, 'rb') as f:
        data = f.read()
    if data[:4] != b'NES\x1a':
        raise SystemExit('not an iNES file')
    prg_size = data[4] * 16 * 1024
    chr_size = data[5] * 8 * 1024
    has_trainer = bool(data[6] & 4)
    header = 16 + (512 if has_trainer else 0)
    return data[header:header + prg_size], prg_size


def disassemble(prg, base):
    """Linear disassembly. base = CPU address PRG is loaded at."""
    end = base + len(prg)
    pc = base
    out = []  # list of (addr, length, mnemonic_str, target_or_None, raw_bytes)
    while pc < end:
        idx = pc - base
        opcode = prg[idx]
        info = OPCODES.get(opcode)
        if info is None:
            out.append((pc, 1, f'.byte ${opcode:02X}', None, [opcode]))
            pc += 1
            continue
        mnem, mode, length = info
        lo = prg[idx + 1] if length >= 2 and idx + 1 < len(prg) else 0
        hi = prg[idx + 2] if length >= 3 and idx + 2 < len(prg) else 0
        operand = fmt_operand(mode, lo, hi, pc)
        target = target_addr(opcode, mode, lo, hi, pc)
        raw = list(prg[idx:idx + length])
        out.append((pc, length, f'{mnem} {operand}'.strip(), target, raw))
        pc += length
    return out


def collect_labels(disasm):
    labels = {}
    for addr, length, text, target, raw in disasm:
        if target is not None:
            labels[target] = labels.get(target) or f'L_{target:04X}'
    return labels


def render(disasm, labels, vectors):
    lines = []
    for name, addr in vectors.items():
        labels[addr] = labels.get(addr) or name
    for addr, length, text, target, raw in disasm:
        label = labels.get(addr)
        prefix = f'{label}:\n' if label else ''
        # Replace numeric target with label in text (rel + abs JMP/JSR)
        if target is not None:
            sub = labels.get(target, f'${target:04X}')
            text = text.replace(f'${target:04X}', sub)
        bytes_str = ' '.join(f'{b:02X}' for b in raw)
        lines.append(f'{prefix}  {addr:04X}: {bytes_str:<10} {text}')
    return '\n'.join(lines)


def find_interesting(disasm):
    """Return dict of categorized findings."""
    out = {
        'lda_imm': [],         # (addr, value)
        'oam_dma': [],         # addresses where STA $4014 occurs
        'controller_reads': [],# addresses where LDA $4016/$4017 occurs
        'cmp_imm': [],
        'sta_2000_2007': [],   # PPU register writes
    }
    for addr, length, text, target, raw in disasm:
        op = raw[0]
        if op == 0xA9:  # LDA #imm
            out['lda_imm'].append((addr, raw[1]))
        elif op == 0xC9:  # CMP #imm
            out['cmp_imm'].append((addr, raw[1]))
        elif op == 0x8D and length == 3:  # STA abs
            tgt = (raw[2] << 8) | raw[1]
            if tgt == 0x4014:
                out['oam_dma'].append(addr)
            elif 0x2000 <= tgt <= 0x2007:
                out['sta_2000_2007'].append((addr, tgt))
        elif op == 0xAD and length == 3:  # LDA abs
            tgt = (raw[2] << 8) | raw[1]
            if tgt in (0x4016, 0x4017):
                out['controller_reads'].append((addr, tgt))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('rom')
    args = ap.parse_args()
    prg, prg_size = parse_ines(args.rom)
    base = 0x10000 - prg_size  # NROM map: PRG sits at end of CPU space

    here = os.path.dirname(os.path.abspath(__file__))
    stem = os.path.splitext(os.path.basename(args.rom))[0]

    # Vectors
    nmi  = (prg[-4] | (prg[-3] << 8))
    rst  = (prg[-6] | (prg[-5] << 8))
    irq  = (prg[-2] | (prg[-1] << 8))
    print(f'PRG size: {prg_size}, base: ${base:04X}')
    print(f'Vectors: RESET=${rst:04X}  NMI=${nmi:04X}  IRQ=${irq:04X}')

    disasm = disassemble(prg, base)
    labels = collect_labels(disasm)
    text = render(disasm, labels, {'_RESET': rst, '_NMI': nmi, '_IRQ': irq})

    asm_path = os.path.join(here, f'{stem}.asm')
    with open(asm_path, 'w') as f:
        f.write(f'; Disassembly of {args.rom}\n')
        f.write(f'; PRG size = {prg_size} bytes; base = ${base:04X}\n')
        f.write(f'; RESET=${rst:04X}  NMI=${nmi:04X}  IRQ=${irq:04X}\n\n')
        f.write(text)
    print(f'Wrote disassembly: {asm_path}')

    # Findings summary
    findings = find_interesting(disasm)
    findings_path = os.path.join(here, f'{stem}.findings.txt')
    with open(findings_path, 'w') as f:
        f.write(f'=== OAM DMA writes (sprite render) ===\n')
        for a in findings['oam_dma']:
            f.write(f'  ${a:04X}\n')
        f.write(f'\n=== Controller reads ===\n')
        for a, t in findings['controller_reads']:
            f.write(f'  ${a:04X}  $4016/$4017 = ${t:04X}\n')
        f.write(f'\n=== PPU register writes ($2000-$2007) ===\n')
        for a, t in findings['sta_2000_2007']:
            f.write(f'  ${a:04X}  STA ${t:04X}\n')
        f.write(f'\n=== LDA #imm distribution (top 30 most common values) ===\n')
        c = collections.Counter(v for _, v in findings['lda_imm'])
        for v, n in c.most_common(30):
            f.write(f'  ${v:02X}  ({v:3d})  x{n}\n')
        f.write(f'\n=== Interesting LDA #imm  (small values likely to be physics deltas) ===\n')
        for a, v in findings['lda_imm']:
            if 0 < v <= 0x10:
                f.write(f'  ${a:04X}  LDA #${v:02X}\n')
    print(f'Wrote findings: {findings_path}')


if __name__ == '__main__':
    main()
