
import Cpu from "./Cpu";

export function isPageCrossed(addressA: number, addressB: number) : boolean
{
    // A page is crossed when the high byte differs from addr1 to addr2
    return addressA >> 8 != addressB >> 8;
}

export const BANK_SIZES = {
    "4k": 0x1000,
    "8k": 0x2000,
    "16k": 0x4000,
    "32k": 0x8000
};

export enum RenderingMode
{
    NORMAL = 0,
    SPLIT = 1
}

export enum Mode
{
    ABSOLUTE = 0,
    ABSOLUTE_X = 1,
    ABSOLUTE_Y = 2,
    ACCUMULATOR = 3,
    IMMEDIATE = 4,
    IMPLIED = 5,
    INDEXED_INDIRECT_X = 6,
    INDIRECT = 7,
    INDIRECT_INDEXED_Y = 8,
    RELATIVE = 9,
    ZERO_PAGE = 10,
    ZERO_PAGE_X = 11,
    ZERO_PAGE_Y = 12
}

export enum OpCode
{
    ADC = 0,
    AND = 1,
    ASL = 2,
    BCC = 3,
    BCS = 4,
    BEQ = 5,
    BIT = 6,
    BMI = 7,
    BNE = 8,
    BPL = 9,
    BRK = 10,
    BVC = 11,
    BVS = 12,
    CLC = 13,
    CLD = 14,
    CLI = 15,
    CLV = 16,
    CMP = 17,
    CPX = 18,
    CPY = 19,
    DEC = 20,
    DEX = 21,
    DEY = 22,
    EOR = 23,
    INC = 24,
    INX = 25,
    INY = 26,
    JMP = 27,
    JSR = 28,
    LDA = 29,
    LDX = 30,
    LDY = 31,
    LSR = 32,
    NOP = 33,
    ORA = 34,
    PHA = 35,
    PHP = 36,
    PLA = 37,
    PLP = 38,
    ROL = 39,
    ROR = 40,
    RTI = 41,
    RTS = 42,
    SBC = 43,
    SEC = 44,
    SED = 45,
    SEI = 46,
    STA = 47,
    STX = 48,
    STY = 49,
    TAX = 50,
    TAY = 51,
    TSX = 52,
    TXA = 53,
    TXS = 54,
    TYA = 55,

    ASL_ACC = 56,
    LSR_ACC = 57,
    ROL_ACC = 58,
    ROR_ACC = 59,

    // TODO: Unused opcodes
    SLO = 60
}

export enum Interrupt
{
    NMI = 0,
    IRQ = 1
}

export enum Button
{
    A = 0,
    B = 1,
    SELECT = 2,
    START = 3,
    UP = 4,
    DOWN = 5,
    LEFT = 6,
    RIGHT = 7
}

export const COLORS: number[] = [
    0x666666,
    0x002a88,
    0x1412a7,
    0x3b00a4,
    0x5c007e,
    0x6e0040,
    0x6c0600,
    0x561d00,
    0x333500,
    0x0b4800,
    0x005200,
    0x004f08,
    0x00404d,
    0x000000,
    0x000000,
    0x000000,
    0xadadad,
    0x155fd9,
    0x4240ff,
    0x7527fe,
    0xa01acc,
    0xb71e7b,
    0xb53120,
    0x994e00,
    0x6b6d00,
    0x388700,
    0x0c9300,
    0x008f32,
    0x007c8d,
    0x000000,
    0x000000,
    0x000000,
    0xfffeff,
    0x64b0ff,
    0x9290ff,
    0xc676ff,
    0xf36aff,
    0xfe6ecc,
    0xfe8170,
    0xea9e22,
    0xbcbe00,
    0x88d800,
    0x5ce430,
    0x45e082,
    0x48cdde,
    0x4f4f4f,
    0x000000,
    0x000000,
    0xfffeff,
    0xc0dfff,
    0xd3d2ff,
    0xe8c8ff,
    0xfbc2ff,
    0xfec4ea,
    0xfeccc5,
    0xf7d8a5,
    0xe4e594,
    0xcfef96,
    0xbdf4ab,
    0xb3f3cc,
    0xb5ebf2,
    0xb8b8b8,
    0x000000,
    0x000000
];

export enum CycleType
{
    ZERO = 0,
    ONE = 1,
    PREFETCH = 2,
    VISIBLE = 3,
    SPRITES = 4,
    COPY_Y = 5,
    COPY_X = 6,
    INCREMENT_Y = 7,
    IDLE = 8,
    FLUSH_TILEDATA = 9,
    MAPPER_TICK = 10
}

export enum ScanLineType
{
    PRELINE = 0,
    VISIBLE = 1,
    VBLANK = 2,
    IDLE = 3
}

//OpCode, Mode, Size, Cycles
export type Instruction = [OpCode, Mode, number, number];

// TODO: Non official instructions
export const INSTRUCTIONS: Array<Instruction|null> = [
    /* 0 */ [OpCode.BRK, Mode.IMPLIED, 1, 7],
    /* 1 */ [OpCode.ORA, Mode.INDEXED_INDIRECT_X, 2, 6],
    /* 2 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 3 */ [OpCode.SLO, Mode.INDEXED_INDIRECT_X, 0, 8],
    /* 4 */ null, //[ OpCode.NOP, Mode.ZERO_PAGE, 2, 3 ],

    /* 5 */ [OpCode.ORA, Mode.ZERO_PAGE, 2, 3],
    /* 6 */ [OpCode.ASL, Mode.ZERO_PAGE, 2, 5],
    /* 7 */ [OpCode.SLO, Mode.ZERO_PAGE, 0, 5],
    /* 8 */ [OpCode.PHP, Mode.IMPLIED, 1, 3],
    /* 9 */ [OpCode.ORA, Mode.IMMEDIATE, 2, 2],
    /* 10 */ [OpCode.ASL_ACC, Mode.ACCUMULATOR, 1, 2],
    /* 11 */ null, //[ OpCode.ANC, Mode.IMMEDIATE, 0, 2 ],
    /* 12 */ null, //[ OpCode.NOP, Mode.ABSOLUTE, 3, 4 ],

    /* 13 */ [OpCode.ORA, Mode.ABSOLUTE, 3, 4],
    /* 14 */ [OpCode.ASL, Mode.ABSOLUTE, 3, 6],
    /* 15 */ [OpCode.SLO, Mode.ABSOLUTE, 0, 6],
    /* 16 */ [OpCode.BPL, Mode.RELATIVE, 2, 2],
    /* 17 */ [OpCode.ORA, Mode.INDIRECT_INDEXED_Y, 2, 5],
    /* 18 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 19 */ [OpCode.SLO, Mode.INDIRECT_INDEXED_Y, 0, 8],
    /* 20 */ null, //[ OpCode.NOP, Mode.ZERO_PAGE_X, 2, 4 ],

    /* 21 */ [OpCode.ORA, Mode.ZERO_PAGE_X, 2, 4],
    /* 22 */ [OpCode.ASL, Mode.ZERO_PAGE_X, 2, 6],
    /* 23 */ [OpCode.SLO, Mode.ZERO_PAGE_X, 0, 6],
    /* 24 */ [OpCode.CLC, Mode.IMPLIED, 1, 2],
    /* 25 */ [OpCode.ORA, Mode.ABSOLUTE_Y, 3, 4],
    /* 26 */ null, //[ OpCode.NOP, Mode.IMPLIED, 1, 2 ],

    /* 27 */ [OpCode.SLO, Mode.ABSOLUTE_Y, 0, 7],
    /* 28 */ null, //[ OpCode.NOP, Mode.ABSOLUTE_X, 3, 4 ],

    /* 29 */ [OpCode.ORA, Mode.ABSOLUTE_X, 3, 4],
    /* 30 */ [OpCode.ASL, Mode.ABSOLUTE_X, 3, 7],
    /* 31 */ [OpCode.SLO, Mode.ABSOLUTE_X, 0, 7],
    /* 32 */ [OpCode.JSR, Mode.ABSOLUTE, 3, 6],
    /* 33 */ [OpCode.AND, Mode.INDEXED_INDIRECT_X, 2, 6],
    /* 34 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 35 */ null, //[ OpCode.RLA, Mode.INDEXED_INDIRECT_X, 0, 8 ],
    /* 36 */ [OpCode.BIT, Mode.ZERO_PAGE, 2, 3],
    /* 37 */ [OpCode.AND, Mode.ZERO_PAGE, 2, 3],
    /* 38 */ [OpCode.ROL, Mode.ZERO_PAGE, 2, 5],
    /* 39 */ null, //[ OpCode.RLA, Mode.ZERO_PAGE, 0, 5 ],
    /* 40 */ [OpCode.PLP, Mode.IMPLIED, 1, 4],
    /* 41 */ [OpCode.AND, Mode.IMMEDIATE, 2, 2],
    /* 42 */ [OpCode.ROL_ACC, Mode.ACCUMULATOR, 1, 2],
    /* 43 */ null, //[ OpCode.ANC, Mode.IMMEDIATE, 0, 2 ],
    /* 44 */ [OpCode.BIT, Mode.ABSOLUTE, 3, 4],
    /* 45 */ [OpCode.AND, Mode.ABSOLUTE, 3, 4],
    /* 46 */ [OpCode.ROL, Mode.ABSOLUTE, 3, 6],
    /* 47 */ null, //[ OpCode.RLA, Mode.ABSOLUTE, 0, 6 ],
    /* 48 */ [OpCode.BMI, Mode.RELATIVE, 2, 2],
    /* 49 */ [OpCode.AND, Mode.INDIRECT_INDEXED_Y, 2, 5],
    /* 50 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 51 */ null, //[ OpCode.RLA, Mode.INDIRECT_INDEXED_Y, 0, 8 ],
    /* 52 */ null, //[ OpCode.NOP, Mode.ZERO_PAGE_X, 2, 4 ],

    /* 53 */ [OpCode.AND, Mode.ZERO_PAGE_X, 2, 4],
    /* 54 */ [OpCode.ROL, Mode.ZERO_PAGE_X, 2, 6],
    /* 55 */ null, //[ OpCode.RLA, Mode.ZERO_PAGE_X, 0, 6 ],
    /* 56 */ [OpCode.SEC, Mode.IMPLIED, 1, 2],
    /* 57 */ [OpCode.AND, Mode.ABSOLUTE_Y, 3, 4],
    /* 58 */ null, //[ OpCode.NOP, Mode.IMPLIED, 1, 2 ],

    /* 59 */ null, //[ OpCode.RLA, Mode.ABSOLUTE_Y, 0, 7 ],
    /* 60 */ null, //[ OpCode.NOP, Mode.ABSOLUTE_X, 3, 4 ],

    /* 61 */ [OpCode.AND, Mode.ABSOLUTE_X, 3, 4],
    /* 62 */ [OpCode.ROL, Mode.ABSOLUTE_X, 3, 7],
    /* 63 */ null, //[ OpCode.RLA, Mode.ABSOLUTE_X, 0, 7 ],
    /* 64 */ [OpCode.RTI, Mode.IMPLIED, 1, 6],
    /* 65 */ [OpCode.EOR, Mode.INDEXED_INDIRECT_X, 2, 6],
    /* 66 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 67 */ null, //[ OpCode.SRE, Mode.INDEXED_INDIRECT_X, 0, 8 ],
    /* 68 */ null, //[ OpCode.NOP, Mode.ZERO_PAGE, 2, 3 ],

    /* 69 */ [OpCode.EOR, Mode.ZERO_PAGE, 2, 3],
    /* 70 */ [OpCode.LSR, Mode.ZERO_PAGE, 2, 5],
    /* 71 */ null, //[ OpCode.SRE, Mode.ZERO_PAGE, 0, 5 ],
    /* 72 */ [OpCode.PHA, Mode.IMPLIED, 1, 3],
    /* 73 */ [OpCode.EOR, Mode.IMMEDIATE, 2, 2],
    /* 74 */ [OpCode.LSR_ACC, Mode.ACCUMULATOR, 1, 2],
    /* 75 */ null, //[ OpCode.ALR, Mode.IMMEDIATE, 0, 2 ],
    /* 76 */ [OpCode.JMP, Mode.ABSOLUTE, 3, 3],
    /* 77 */ [OpCode.EOR, Mode.ABSOLUTE, 3, 4],
    /* 78 */ [OpCode.LSR, Mode.ABSOLUTE, 3, 6],
    /* 79 */ null, //[ OpCode.SRE, Mode.ABSOLUTE, 0, 6 ],
    /* 80 */ [OpCode.BVC, Mode.RELATIVE, 2, 2],
    /* 81 */ [OpCode.EOR, Mode.INDIRECT_INDEXED_Y, 2, 5],
    /* 82 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 83 */ null, //[ OpCode.SRE, Mode.INDIRECT_INDEXED_Y, 0, 8 ],
    /* 84 */ null, //[ OpCode.NOP, Mode.ZERO_PAGE_X, 2, 4 ],

    /* 85 */ [OpCode.EOR, Mode.ZERO_PAGE_X, 2, 4],
    /* 86 */ [OpCode.LSR, Mode.ZERO_PAGE_X, 2, 6],
    /* 87 */ null, //[ OpCode.SRE, Mode.ZERO_PAGE_X, 0, 6 ],
    /* 88 */ [OpCode.CLI, Mode.IMPLIED, 1, 2],
    /* 89 */ [OpCode.EOR, Mode.ABSOLUTE_Y, 3, 4],
    /* 90 */ null, //[ OpCode.NOP, Mode.IMPLIED, 1, 2 ],

    /* 91 */ null, //[ OpCode.SRE, Mode.ABSOLUTE_Y, 0, 7 ],
    /* 92 */ null, //[ OpCode.NOP, Mode.ABSOLUTE_X, 3, 4 ],

    /* 93 */ [OpCode.EOR, Mode.ABSOLUTE_X, 3, 4],
    /* 94 */ [OpCode.LSR, Mode.ABSOLUTE_X, 3, 7],
    /* 95 */ null, //[ OpCode.SRE, Mode.ABSOLUTE_X, 0, 7 ],
    /* 96 */ [OpCode.RTS, Mode.IMPLIED, 1, 6],
    /* 97 */ [OpCode.ADC, Mode.INDEXED_INDIRECT_X, 2, 6],
    /* 98 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 99 */ null, //[ OpCode.RRA, Mode.INDEXED_INDIRECT_X, 0, 8 ],
    /* 100 */ null, //[ OpCode.NOP, Mode.ZERO_PAGE, 2, 3 ],

    /* 101 */ [OpCode.ADC, Mode.ZERO_PAGE, 2, 3],
    /* 102 */ [OpCode.ROR, Mode.ZERO_PAGE, 2, 5],
    /* 103 */ null, //[ OpCode.RRA, Mode.ZERO_PAGE, 0, 5 ],
    /* 104 */ [OpCode.PLA, Mode.IMPLIED, 1, 4],
    /* 105 */ [OpCode.ADC, Mode.IMMEDIATE, 2, 2],
    /* 106 */ [OpCode.ROR_ACC, Mode.ACCUMULATOR, 1, 2],
    /* 107 */ null, //[ OpCode.ARR, Mode.IMMEDIATE, 0, 2 ],
    /* 108 */ [OpCode.JMP, Mode.INDIRECT, 3, 5],
    /* 109 */ [OpCode.ADC, Mode.ABSOLUTE, 3, 4],
    /* 110 */ [OpCode.ROR, Mode.ABSOLUTE, 3, 6],
    /* 111 */ null, //[ OpCode.RRA, Mode.ABSOLUTE, 0, 6 ],
    /* 112 */ [OpCode.BVS, Mode.RELATIVE, 2, 2],
    /* 113 */ [OpCode.ADC, Mode.INDIRECT_INDEXED_Y, 2, 5],
    /* 114 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 115 */ null, //[ OpCode.RRA, Mode.INDIRECT_INDEXED_Y, 0, 8 ],
    /* 116 */ null, //[ OpCode.NOP, Mode.ZERO_PAGE_X, 2, 4 ],

    /* 117 */ [OpCode.ADC, Mode.ZERO_PAGE_X, 2, 4],
    /* 118 */ [OpCode.ROR, Mode.ZERO_PAGE_X, 2, 6],
    /* 119 */ null, //[ OpCode.RRA, Mode.ZERO_PAGE_X, 0, 6 ],
    /* 120 */ [OpCode.SEI, Mode.IMPLIED, 1, 2],
    /* 121 */ [OpCode.ADC, Mode.ABSOLUTE_Y, 3, 4],
    /* 122 */ null, //[ OpCode.NOP, Mode.IMPLIED, 1, 2 ],

    /* 123 */ null, //[ OpCode.RRA, Mode.ABSOLUTE_Y, 0, 7 ],
    /* 124 */ null, //[ OpCode.NOP, Mode.ABSOLUTE_X, 3, 4 ],

    /* 125 */ [OpCode.ADC, Mode.ABSOLUTE_X, 3, 4],
    /* 126 */ [OpCode.ROR, Mode.ABSOLUTE_X, 3, 7],
    /* 127 */ null, //[ OpCode.RRA, Mode.ABSOLUTE_X, 0, 7 ],
    /* 128 */ null, //[ OpCode.NOP, Mode.IMMEDIATE, 2, 2 ],

    /* 129 */ [OpCode.STA, Mode.INDEXED_INDIRECT_X, 2, 6],
    /* 130 */ null, //[ OpCode.NOP, Mode.IMMEDIATE, 0, 2 ],

    /* 131 */ null, //[ OpCode.SAX, Mode.INDEXED_INDIRECT_X, 0, 6 ],
    /* 132 */ [OpCode.STY, Mode.ZERO_PAGE, 2, 3],
    /* 133 */ [OpCode.STA, Mode.ZERO_PAGE, 2, 3],
    /* 134 */ [OpCode.STX, Mode.ZERO_PAGE, 2, 3],
    /* 135 */ null, //[ OpCode.SAX, Mode.ZERO_PAGE, 0, 3 ],
    /* 136 */ [OpCode.DEY, Mode.IMPLIED, 1, 2],
    /* 137 */ null, //[ OpCode.NOP, Mode.IMMEDIATE, 0, 2 ],

    /* 138 */ [OpCode.TXA, Mode.IMPLIED, 1, 2],
    /* 139 */ null, //[ OpCode.XAA, Mode.IMMEDIATE, 0, 2 ],
    /* 140 */ [OpCode.STY, Mode.ABSOLUTE, 3, 4],
    /* 141 */ [OpCode.STA, Mode.ABSOLUTE, 3, 4],
    /* 142 */ [OpCode.STX, Mode.ABSOLUTE, 3, 4],
    /* 143 */ null, //[ OpCode.SAX, Mode.ABSOLUTE, 0, 4 ],
    /* 144 */ [OpCode.BCC, Mode.RELATIVE, 2, 2],
    /* 145 */ [OpCode.STA, Mode.INDIRECT_INDEXED_Y, 2, 6],
    /* 146 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 147 */ null, //[ OpCode.AHX, Mode.INDIRECT_INDEXED_Y, 0, 6 ],
    /* 148 */ [OpCode.STY, Mode.ZERO_PAGE_X, 2, 4],
    /* 149 */ [OpCode.STA, Mode.ZERO_PAGE_X, 2, 4],
    /* 150 */ [OpCode.STX, Mode.ZERO_PAGE_Y, 2, 4],
    /* 151 */ null, //[ OpCode.SAX, Mode.ZERO_PAGE_Y, 0, 4 ],
    /* 152 */ [OpCode.TYA, Mode.IMPLIED, 1, 2],
    /* 153 */ [OpCode.STA, Mode.ABSOLUTE_Y, 3, 5],
    /* 154 */ [OpCode.TXS, Mode.IMPLIED, 1, 2],
    /* 155 */ null, //[ OpCode.TAS, Mode.ABSOLUTE_Y, 0, 5 ],
    /* 156 */ null, //[ OpCode.SHY, Mode.ABSOLUTE_X, 0, 5 ],
    /* 157 */ [OpCode.STA, Mode.ABSOLUTE_X, 3, 5],
    /* 158 */ null, //[ OpCode.SHX, Mode.ABSOLUTE_Y, 0, 5 ],
    /* 159 */ null, //[ OpCode.AHX, Mode.ABSOLUTE_Y, 0, 5 ],
    /* 160 */ [OpCode.LDY, Mode.IMMEDIATE, 2, 2],
    /* 161 */ [OpCode.LDA, Mode.INDEXED_INDIRECT_X, 2, 6],
    /* 162 */ [OpCode.LDX, Mode.IMMEDIATE, 2, 2],
    /* 163 */ null, //[ OpCode.LAX, Mode.INDEXED_INDIRECT_X, 0, 6 ],
    /* 164 */ [OpCode.LDY, Mode.ZERO_PAGE, 2, 3],
    /* 165 */ [OpCode.LDA, Mode.ZERO_PAGE, 2, 3],
    /* 166 */ [OpCode.LDX, Mode.ZERO_PAGE, 2, 3],
    /* 167 */ null, //[ OpCode.LAX, Mode.ZERO_PAGE, 0, 3 ],
    /* 168 */ [OpCode.TAY, Mode.IMPLIED, 1, 2],
    /* 169 */ [OpCode.LDA, Mode.IMMEDIATE, 2, 2],
    /* 170 */ [OpCode.TAX, Mode.IMPLIED, 1, 2],
    /* 171 */ null, //[ OpCode.LAX, Mode.IMMEDIATE, 0, 2 ],
    /* 172 */ [OpCode.LDY, Mode.ABSOLUTE, 3, 4],
    /* 173 */ [OpCode.LDA, Mode.ABSOLUTE, 3, 4],
    /* 174 */ [OpCode.LDX, Mode.ABSOLUTE, 3, 4],
    /* 175 */ null, //[ OpCode.LAX, Mode.ABSOLUTE, 0, 4 ],
    /* 176 */ [OpCode.BCS, Mode.RELATIVE, 2, 2],
    /* 177 */ [OpCode.LDA, Mode.INDIRECT_INDEXED_Y, 2, 5],
    /* 178 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 179 */ null, //[ OpCode.LAX, Mode.INDIRECT_INDEXED_Y, 0, 5 ],
    /* 180 */ [OpCode.LDY, Mode.ZERO_PAGE_X, 2, 4],
    /* 181 */ [OpCode.LDA, Mode.ZERO_PAGE_X, 2, 4],
    /* 182 */ [OpCode.LDX, Mode.ZERO_PAGE_Y, 2, 4],
    /* 183 */ null, //[ OpCode.LAX, Mode.ZERO_PAGE_Y, 0, 4 ],
    /* 184 */ [OpCode.CLV, Mode.IMPLIED, 1, 2],
    /* 185 */ [OpCode.LDA, Mode.ABSOLUTE_Y, 3, 4],
    /* 186 */ [OpCode.TSX, Mode.IMPLIED, 1, 2],
    /* 187 */ null, //[ OpCode.LAS, Mode.ABSOLUTE_Y, 0, 4 ],
    /* 188 */ [OpCode.LDY, Mode.ABSOLUTE_X, 3, 4],
    /* 189 */ [OpCode.LDA, Mode.ABSOLUTE_X, 3, 4],
    /* 190 */ [OpCode.LDX, Mode.ABSOLUTE_Y, 3, 4],
    /* 191 */ null, //[ OpCode.LAX, Mode.ABSOLUTE_Y, 0, 4 ],
    /* 192 */ [OpCode.CPY, Mode.IMMEDIATE, 2, 2],
    /* 193 */ [OpCode.CMP, Mode.INDEXED_INDIRECT_X, 2, 6],
    /* 194 */ null, //[ OpCode.NOP, Mode.IMMEDIATE, 0, 2 ],

    /* 195 */ null, //[ OpCode.DCP, Mode.INDEXED_INDIRECT_X, 0, 8 ],
    /* 196 */ [OpCode.CPY, Mode.ZERO_PAGE, 2, 3],
    /* 197 */ [OpCode.CMP, Mode.ZERO_PAGE, 2, 3],
    /* 198 */ [OpCode.DEC, Mode.ZERO_PAGE, 2, 5],
    /* 199 */ null, //[OpCode.DCP, Mode.ZERO_PAGE, 0, 5],
    /* 200 */ [OpCode.INY, Mode.IMPLIED, 1, 2],
    /* 201 */ [OpCode.CMP, Mode.IMMEDIATE, 2, 2],
    /* 202 */ [OpCode.DEX, Mode.IMPLIED, 1, 2],
    /* 203 */ null, //[ OpCode.AXS, Mode.IMMEDIATE, 0, 2 ],
    /* 204 */ [OpCode.CPY, Mode.ABSOLUTE, 3, 4],
    /* 205 */ [OpCode.CMP, Mode.ABSOLUTE, 3, 4],
    /* 206 */ [OpCode.DEC, Mode.ABSOLUTE, 3, 6],
    /* 207 */ null, //[ OpCode.DCP, Mode.ABSOLUTE, 0, 6 ],
    /* 208 */ [OpCode.BNE, Mode.RELATIVE, 2, 2],
    /* 209 */ [OpCode.CMP, Mode.INDIRECT_INDEXED_Y, 2, 5],
    /* 210 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 211 */ null, //[ OpCode.DCP, Mode.INDIRECT_INDEXED_Y, 0, 8 ],
    /* 212 */ null, //[ OpCode.NOP, Mode.ZERO_PAGE_X, 2, 4 ],

    /* 213 */ [OpCode.CMP, Mode.ZERO_PAGE_X, 2, 4],
    /* 214 */ [OpCode.DEC, Mode.ZERO_PAGE_X, 2, 6],
    /* 215 */ null, //[ OpCode.DCP, Mode.ZERO_PAGE_X, 0, 6 ],
    /* 216 */ [OpCode.CLD, Mode.IMPLIED, 1, 2],
    /* 217 */ [OpCode.CMP, Mode.ABSOLUTE_Y, 3, 4],
    /* 218 */ null, //[ OpCode.NOP, Mode.IMPLIED, 1, 2 ],

    /* 219 */ null, //[ OpCode.DCP, Mode.ABSOLUTE_Y, 0, 7 ],
    /* 220 */ null, //[ OpCode.NOP, Mode.ABSOLUTE_X, 3, 4 ],

    /* 221 */ [OpCode.CMP, Mode.ABSOLUTE_X, 3, 4],
    /* 222 */ [OpCode.DEC, Mode.ABSOLUTE_X, 3, 7],
    /* 223 */ null, //[ OpCode.DCP, Mode.ABSOLUTE_X, 0, 7 ],
    /* 224 */ [OpCode.CPX, Mode.IMMEDIATE, 2, 2],
    /* 225 */ [OpCode.SBC, Mode.INDEXED_INDIRECT_X, 2, 6],
    /* 226 */ null, //[ OpCode.NOP, Mode.IMMEDIATE, 0, 2 ],

    /* 227 */ null, //[ OpCode.ISC, Mode.INDEXED_INDIRECT_X, 0, 8 ],
    /* 228 */ [OpCode.CPX, Mode.ZERO_PAGE, 2, 3],
    /* 229 */ [OpCode.SBC, Mode.ZERO_PAGE, 2, 3],
    /* 230 */ [OpCode.INC, Mode.ZERO_PAGE, 2, 5],
    /* 231 */ null, //[ OpCode.ISC, Mode.ZERO_PAGE, 0, 5 ],
    /* 232 */ [OpCode.INX, Mode.IMPLIED, 1, 2],
    /* 233 */ [OpCode.SBC, Mode.IMMEDIATE, 2, 2],
    /* 234 */ [OpCode.NOP, Mode.IMPLIED, 1, 2],

    /* 235 */ [OpCode.SBC, Mode.IMMEDIATE, 2, 2],
    /* 236 */ [OpCode.CPX, Mode.ABSOLUTE, 3, 4],
    /* 237 */ [OpCode.SBC, Mode.ABSOLUTE, 3, 4],
    /* 238 */ [OpCode.INC, Mode.ABSOLUTE, 3, 6],
    /* 239 */ null, //[OpCode.ISC, Mode.ABSOLUTE, 0, 6],
    /* 240 */ [OpCode.BEQ, Mode.RELATIVE, 2, 2],
    /* 241 */ [OpCode.SBC, Mode.INDIRECT_INDEXED_Y, 2, 5],
    /* 242 */ null, //[ OpCode.KIL, Mode.IMPLIED, 0, 2 ],
    /* 243 */ null, //[ OpCode.ISC, Mode.INDIRECT_INDEXED_Y, 0, 8 ],
    /* 244 */ null, //[ OpCode.NOP, Mode.ZERO_PAGE_X, 2, 4 ],

    /* 245 */ [OpCode.SBC, Mode.ZERO_PAGE_X, 2, 4],
    /* 246 */ [OpCode.INC, Mode.ZERO_PAGE_X, 2, 6],
    /* 247 */ null, //[OpCode.ISC, Mode.ZERO_PAGE_X, 0, 6],
    /* 248 */ [OpCode.SED, Mode.IMPLIED, 1, 2],
    /* 249 */ [OpCode.SBC, Mode.ABSOLUTE_Y, 3, 4],
    /* 250 */ null, //[ OpCode.NOP, Mode.IMPLIED, 1, 2 ],

    /* 251 */ null, //[ OpCode.ISC, Mode.ABSOLUTE_Y, 0, 7 ],
    /* 252 */ null, //[ OpCode.NOP, Mode.ABSOLUTE_X, 3, 4 ],

    /* 253 */ [OpCode.SBC, Mode.ABSOLUTE_X, 3, 4],
    /* 254 */ [OpCode.INC, Mode.ABSOLUTE_X, 3, 7],
    /* 255 */ null //[ OpCode.ISC, Mode.ABSOLUTE_X, 0, 7 ]
];

export type OpCodeHandler = (cpu: Cpu, address: number) => void;

export const OP_CODE_HANDLERS: OpCodeHandler[] = [
    // ADC - Add with Carry
    (cpu: Cpu, address: number) =>
    {
        let a = cpu.a;
        let value = cpu.read8(address);
        cpu.a = a + value + cpu.c;

        if (cpu.a > 0xff) {
            cpu.c = 1;
        } else {
            cpu.c = 0;
        }

        // Useless?
        cpu.a = cpu.a & 0xff;

        if (((a ^ value) & 0x80) === 0 && ((a ^ cpu.a) & 0x80) !== 0) {
            cpu.v = 1;
        } else {
            cpu.v = 0;
        }

        cpu.setNegativeFlag(cpu.a);
        cpu.setZeroFlag(cpu.a);
        cpu.cycles += cpu.b;
    },
    // AND - Logical AND
    (cpu: Cpu, address: number) =>
    {
        let value = cpu.read8(address);
        cpu.a = cpu.a & value;
        cpu.setNegativeFlag(cpu.a);
        cpu.setZeroFlag(cpu.a);

        cpu.cycles += cpu.b;
    },
    // ASL - Arithmetic Shift Left
    (cpu: Cpu, address: number) =>
    {
        let value = cpu.read8(address);
        cpu.c = (value >> 7) & 1;
        value = (value << 1) & 0xff;
        cpu.setZeroFlag(value);
        cpu.setNegativeFlag(value);
        cpu.write8(address, value);
    },
    // BCC - Branch if Carry Clear
    (cpu: Cpu, address: number) =>
    {
        if (cpu.c == 0) {
            cpu.cycles += isPageCrossed(cpu.pc, address) ? 2 : 1;
            cpu.pc = address & 0xffff;
        }
    },
    // BCS - Branch if Carry Set
    (cpu: Cpu, address: number) =>
    {
        if (cpu.c == 1) {
            cpu.cycles += isPageCrossed(cpu.pc, address) ? 2 : 1;
            cpu.pc = address & 0xffff;
        }
    },
    // BEQ - Branch if Equal
    (cpu: Cpu, address: number) =>
    {
        if (cpu.z == 1) {
            cpu.cycles += isPageCrossed(cpu.pc, address) ? 2 : 1;
            cpu.pc = address & 0xffff;
        }
    },
    // BIT - Bit Test
    (cpu: Cpu, address: number) =>
    {
        let value = cpu.read8(address);
        cpu.v = (value >> 6) & 1;
        cpu.setZeroFlag(value & cpu.a);
        cpu.setNegativeFlag(value);
    },
    // BMI - Branch if Minus
    (cpu: Cpu, address: number) =>
    {
        if (cpu.n == 1) {
            cpu.cycles += isPageCrossed(cpu.pc, address) ? 2 : 1;
            cpu.pc = address & 0xffff;
        }
    },
    // BNE - Branch if Not Equal
    (cpu: Cpu, address: number) => {
        if (cpu.z == 0) {
            cpu.cycles += isPageCrossed(cpu.pc, address) ? 2 : 1;
            cpu.pc = address & 0xffff;
        }
    },
    // BPI - Branch if Positive
    (cpu: Cpu, address: number) =>
    {
        if (cpu.n == 0) {
            cpu.cycles += isPageCrossed(cpu.pc, address) ? 2 : 1;
            cpu.pc = address & 0xffff;
        }
    },
    // BRK - Force Interrupt
    // TODO: http://nesdev.com/the%20'B'%20flag%20&%20BRK%20instruction.txt
    (cpu: Cpu, address: number) =>
    {
        cpu.stackPush16(cpu.pc + 1);
        // PHP
        cpu.stackPush8(cpu.getFlags() | 0x18);
        // SEI
        cpu.i = 1;
        cpu.pc = cpu.read16(0xfffe);
    },
    // BVC - Branch if Overflow clear
    (cpu: Cpu, address: number) =>
    {
        if (cpu.v == 0) {
            cpu.cycles += isPageCrossed(cpu.pc, address) ? 2 : 1;
            cpu.pc = address & 0xffff;
        }
    },
    // CLC - Clear Carry Flag
    (cpu: Cpu, address: number) =>
    {
        cpu.c = 0;
    },
    // CLD - Clear Decimal Mode
    (cpu: Cpu, address: number) =>
    {
        cpu.d = 0;
    },
    // CLI - Clear Interrupt Disable
    (cpu: Cpu, address: number) =>
    {
        cpu.i = 0;
    },
    // CLV - Clear Overflow Flag
    (cpu: Cpu, address: number) =>
    {
        cpu.v = 0;
    },
    // CMP - Compare
    (cpu: Cpu, address: number) =>
    {
        let value = cpu.read8(address);
        let tmpA = cpu.a - value;

        if (cpu.a >= value) {
            cpu.c = 1;
        } else {
            cpu.c = 0;
        }

        cpu.setNegativeFlag(tmpA);
        cpu.setZeroFlag(tmpA);

        cpu.cycles += cpu.b;
    },
    // CPX - Compare X Register
    (cpu: Cpu, address: number) =>
    {
        let value = cpu.read8(address);
        let tmpX = cpu.x - value;

        if (cpu.x >= value) {
            cpu.c = 1;
        } else {
            cpu.c = 0;
        }

        cpu.setNegativeFlag(tmpX);
        cpu.setZeroFlag(tmpX);
    },
    // CPY - Compare Y Register
    (cpu: Cpu, address: number) =>
    {
        let value = cpu.read8(address);
        let tmpY = cpu.y - value;

        if (cpu.y >= value) {
            cpu.c = 1;
        } else {
            cpu.c = 0;
        }

        cpu.setNegativeFlag(tmpY);
        cpu.setZeroFlag(tmpY);
    },
    // DEC - Decrement Memory
    (cpu: Cpu, address: number) =>
    {
        let value = cpu.read8(address);
        value = (value - 1) & 0xff;

        cpu.setNegativeFlag(value);
        cpu.setZeroFlag(value);
        cpu.write8(address, value);
    },
    // DEX - Decrement X Register
    (cpu: Cpu, address: number) =>
    {
        cpu.x = (cpu.x - 1) & 0xff;
        cpu.setZeroFlag(cpu.x);
        cpu.setNegativeFlag(cpu.x);
    },
    // DEY - Decrement Y Register
    (cpu: Cpu, address: number) =>
    {
        cpu.y = (cpu.y - 1) & 0xff;
        cpu.setNegativeFlag(cpu.y);
        cpu.setZeroFlag(cpu.y);
    },
    // Exclusive OR
    (cpu: Cpu, address: number) =>
    {
        let value = cpu.read8(address);
        cpu.a = (cpu.a ^ value) & 0xff;

        cpu.setZeroFlag(cpu.a);
        cpu.setNegativeFlag(cpu.a);

        cpu.cycles += cpu.b;
    },
    // INC - Increment Memory
    (cpu: Cpu, address: number) =>
    {
        let value = (cpu.read8(address) + 1) & 0xff;

        cpu.setNegativeFlag(value);
        cpu.setZeroFlag(value);

        cpu.write8(address, value);
    },
    // INX - Increment X Register
    (cpu: Cpu, address: number) =>
    {
        cpu.x = (cpu.x + 1) & 0xff;
        cpu.setNegativeFlag(cpu.x);
        cpu.setZeroFlag(cpu.x);
    },
    // INY - Increment Y Register
    (cpu: Cpu, address: number) =>
    {
        cpu.y = (cpu.y + 1) & 0xff;
        cpu.setNegativeFlag(cpu.y);
        cpu.setZeroFlag(cpu.y);
    },
    // JMP - Jump
    // FIXME https://github.com/christopherpow/nes-test-roms/blob/master/stress/NEStress.txt#L141
    (cpu: Cpu, address: number) =>
    {
        cpu.pc = address & 0xffff;
    },
    // JSR - Jump to subroutine
    (cpu: Cpu, address: number) =>
    {
        cpu.stackPush16(cpu.pc - 1);
        cpu.pc = address & 0xffff;
    },
    // LDA - Load Accumulator
    (cpu: Cpu, address: number) =>
    {
        cpu.a = cpu.read8(address);

        cpu.setNegativeFlag(cpu.a);
        cpu.setZeroFlag(cpu.a);

        cpu.cycles += cpu.b;
    },
    // LDX - Load X Register
    (cpu: Cpu, address: number) =>
    {
        cpu.x = cpu.read8(address);
        cpu.setNegativeFlag(cpu.x);
        cpu.setZeroFlag(cpu.x);

        cpu.cycles += cpu.b;
    },
    // LDY - Load Y Register
    (cpu: Cpu, address: number) =>
    {
        cpu.y = cpu.read8(address);
        cpu.setNegativeFlag(cpu.y);
        cpu.setZeroFlag(cpu.y);

        cpu.cycles += cpu.b;
    },

    // LSR - Logical Shift Right
    (cpu: Cpu, address: number) =>
    {
        let value = cpu.read8(address);

        cpu.c = value & 1;
        value = value >> 1;

        cpu.write8(address, value);
        cpu.setNegativeFlag(value);
        cpu.setZeroFlag(value);
    },
    // NOP - No Operation
    (cpu: Cpu, address: number) => {},
    // ORA - Logical Inclusive OR
    (cpu: Cpu, address: number) =>
    {
        cpu.a = cpu.a | cpu.read8(address);
        cpu.setNegativeFlag(cpu.a);
        cpu.setZeroFlag(cpu.a);

        cpu.cycles += cpu.b;
    },
    // PHA - Push Accumulator
    (cpu: Cpu, address: number) =>
    {
        cpu.stackPush8(cpu.a);
    },
    // PHP - Push Processor Status
    (cpu: Cpu, address: number) =>
    {
        cpu.stackPush8(cpu.getFlags() | 0x10);
    },
    // PLA - Pull Accumulator
    (cpu: Cpu, address: number) =>
    {
        cpu.a = cpu.stackPull8();
        cpu.setNegativeFlag(cpu.a);
        cpu.setZeroFlag(cpu.a);
    },
    // PLP - Pull Processor Status
    (cpu: Cpu, address: number) =>
    {
        cpu.setFlags((cpu.stackPull8() & 0xef) | 0x20);
    },
    // ROL - Rotate Left
    (cpu: Cpu, address: number) =>
    {
        let tmpC = cpu.c;
        let value = cpu.read8(address);

        cpu.c = (value >> 7) & 1;
        value = ((value << 1) & 0xff) | tmpC;

        cpu.write8(address, value);
        cpu.setNegativeFlag(value);
        cpu.setZeroFlag(value);
    },
    // ROR - Rotate Right
    (cpu: Cpu, address: number) =>
    {
        let tmpC = cpu.c;
        let value = cpu.read8(address);

        cpu.c = value & 1;
        value = (value >> 1) + (tmpC << 7);

        cpu.write8(address, value);
        cpu.setNegativeFlag(value);
        cpu.setZeroFlag(value);
    },
    // RTI - Return from Interrupt
    (cpu: Cpu, address: number) =>
    {
        cpu.setFlags(cpu.stackPull8() | 0x20);
        cpu.pc = cpu.stackPull16();
    },
    // RTS - Return From Subroutine
    (cpu: Cpu, address: number) =>
    {
        cpu.pc = cpu.stackPull16() + 1;
    },
    // SBC - Subtract with Carry
    (cpu: Cpu, address: number) =>
    {
        let a = cpu.a;
        let b = cpu.read8(address);
        let c = cpu.c;

        cpu.a = (cpu.a - b - (1 - cpu.c)) & 0xff;

        cpu.setNegativeFlag(cpu.a);
        cpu.setZeroFlag(cpu.a);

        if (a - b - (1 - c) >= 0) {
            cpu.c = 1;
        } else {
            cpu.c = 0;
        }

        if (((a ^ b) & 0x80) != 0 && ((a ^ cpu.a) & 0x80) != 0) {
            cpu.v = 1;
        } else {
            cpu.v = 0;
        }

        cpu.cycles += cpu.b;
    },
    // SEC - Set Carry Flag
    (cpu: Cpu, address: number) =>
    {
        cpu.c = 1;
    },
    // SED - Set Decimal Flag
    (cpu: Cpu, address: number) =>
    {
        cpu.d = 1;
    },
    // SEI - Set Interrupt Disable
    (cpu: Cpu, address: number) =>
    {
        cpu.i = 1;
    },

    // STA - Store Accumulator
    (cpu: Cpu, address: number) =>
    {
        cpu.write8(address, cpu.a);
    },
    // STX - Store X Register
    (cpu: Cpu, address: number) =>
    {
        cpu.write8(address, cpu.x);
    },
    // STY - Store Y Register
    (cpu: Cpu, address: number) =>
    {
        cpu.write8(address, cpu.y);
    },

    // TAX - Transfer Accumulator to X
    (cpu: Cpu, address: number) =>
    {
        cpu.x = cpu.a;
        cpu.setNegativeFlag(cpu.x);
        cpu.setZeroFlag(cpu.x);
    },
    // TAY - Transfer Accumulator to Y
    (cpu: Cpu, address: number) =>
    {
        cpu.y = cpu.a;
        cpu.setNegativeFlag(cpu.y);
        cpu.setZeroFlag(cpu.y);
    },
    // TSX - Transfer Stack pointer to X
    (cpu: Cpu, address: number) =>
    {
        cpu.x = cpu.sp;
        cpu.setNegativeFlag(cpu.x);
        cpu.setZeroFlag(cpu.x);
    },
    // TXA - Transfer X to A
    (cpu: Cpu, address: number) =>
    {
        cpu.a = cpu.x;
        cpu.setZeroFlag(cpu.a);
        cpu.setNegativeFlag(cpu.a);
    },
    // TXS - Transfer X to Stack Pointer
    (cpu: Cpu, address: number) =>
    {
        cpu.sp = cpu.x;
    },
    // TYA - Transfer Y to Accumulator
    (cpu: Cpu, address: number) =>
    {
        cpu.a = cpu.y;
        cpu.setNegativeFlag(cpu.a);
        cpu.setZeroFlag(cpu.a);
    },

    // ASL_ACC - Arithmetic Shift Left (Accumulator Mode)
    (cpu: Cpu, address: number) =>
    {
        cpu.c = (cpu.a >> 7) & 1;
        cpu.a = (cpu.a << 1) & 0xff;

        cpu.setZeroFlag(cpu.a);
        cpu.setNegativeFlag(cpu.a);
    },

    // LSR_ACC - Logical Shift Right (Accumulator Mode)
    (cpu: Cpu, address: number) =>
    {
        cpu.c = cpu.a & 1;
        cpu.a = cpu.a >> 1;

        cpu.setNegativeFlag(cpu.a);
        cpu.setZeroFlag(cpu.a);
    },
    // ROL_ACC - Rotate Left (Accumulator)
    (cpu: Cpu, address: number) =>
    {
        let tmpC = cpu.c;
        cpu.c = (cpu.a >> 7) & 1;
        cpu.a = ((cpu.a << 1) & 0xff) | tmpC;
        cpu.setNegativeFlag(cpu.a);
        cpu.setZeroFlag(cpu.a);
    },

    // ROR_ACC - Rotate Right (Accumulator)
    (cpu: Cpu, address: number) =>
    {
        let tmpC = cpu.c;
        cpu.c = cpu.a & 1;
        cpu.a = (cpu.a >> 1) + (tmpC << 7);
        cpu.setNegativeFlag(cpu.a);
        cpu.setZeroFlag(cpu.a);
    },

    // SLO
    (cpu: Cpu, address: number) => {}
    // TODO: Unused opcodes
];


export type ModeHandler = (cpu: Cpu) => number;
/**
 *   Computes and returns a memory address (max 16bit)
 *   http://wiki.nesdev.com/w/index.php/CPU_addressing_modes
 */
export const MODE_HANDLERS: ModeHandler[] = [
    //ABSOLUTE
    cpu =>
    {
        return cpu.read16(cpu.pc + 1);
    },
    //ABSOLUTE_X
    cpu =>
    {
        let address = (cpu.read16(cpu.pc + 1) + cpu.x) & 0xffff;
        if (isPageCrossed(address - cpu.x, address)) {
            cpu.b = 1;
        }
        return address;
    },
    //ABSOLUTE_Y
    cpu =>
    {
        let address = (cpu.read16(cpu.pc + 1) + cpu.y) & 0xffff;
        if (isPageCrossed(address - cpu.y, address)) {
            cpu.b = 1;
        }
        return address;
    },
    //ACCUMULATOR
    cpu =>
    {
        return cpu.a;
    },
    //IMMEDIATE
    cpu =>
    {
        return cpu.pc + 1;
    },
    //IMPLIED
    cpu =>
    {
        return 0;
    },
    //INDEXED_INDIRECT_X
    cpu =>
    {
        return cpu.read16Indirect((cpu.read8(cpu.pc + 1) + cpu.x) & 0xff);
    },
    //INDIRECT_INDEXED_Y
    cpu =>
    {
        let address = (cpu.read16Indirect(cpu.read8(cpu.pc + 1)) + cpu.y) & 0xffff;
        if (isPageCrossed(address - cpu.y, address)) {
            cpu.b = 1;
        }
        return address;
    },
    //RELATIVE
    cpu =>
    {
        let address = cpu.read8(cpu.pc + 1);
        if (address < 0x80) {
            return address + cpu.pc + 2;
        } else {
            return address + cpu.pc + 2 - 0x100;
        }
    },
    //ZERO_PAGE
    cpu =>
    {
        return cpu.read8(cpu.pc + 1);
    },
    //ZERO_PAGE_X
    cpu =>
    {
        return (cpu.read8(cpu.pc + 1) + cpu.x) & 0xff;
    },
    //ZERO_PAGE_Y
    cpu =>
    {
        return (cpu.read8(cpu.pc + 1) + cpu.y) & 0xff;
    }
];