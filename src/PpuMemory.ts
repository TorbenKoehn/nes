
import Mapper from "./mappers/Mapper";

export enum MirrorType
{
    HORIZONTAL = 0,
    VERTICAL = 1,
    SINGLE_SCREEN = 2,
    SINGLE_SCREEN_2 = 3,
    QUADRUPLE_SCREEN = 4
}

/**
 * http://wiki.nesdev.com/w/index.php/PPU_nametables
 */
class NameTable
{
    data: Uint8Array = new Uint8Array(2048).fill(0x00);
    mirrors: number[][] = [
        [0, 0, 1, 1], // Horizontal
        [0, 1, 0, 1], // Vertical
        [0, 0, 0, 0], // Single screen
        [1, 1, 1, 1], // Single screen 2
        [0, 1, 2, 3] // 4 Screen
    ];

    flush()
    {
        this.data.fill(0x00);
    }

    save(): Uint8Array
    {
        return this.data;
    }

    load(data: Uint8Array): void
    {
        this.data = new Uint8Array(data);
    }

    write8(type: MirrorType, address: number, value: number) : void
    {
        this.data[this.resolve(type, address)] = value;
    }

    read8(type: MirrorType, address: number): number
    {
        return this.data[this.resolve(type, address)];
    }

    private resolve(mode: MirrorType, address: number)
    {
        address = address % 0x1000;
        return this.mirrors[mode][parseInt(String(address / 0x400))] * 0x400 + (address % 0x400);
    }
}

/**
 * Color lookup table
 * 8 palettes of 4 colors
 */
class PaletteTable
{
    data = new Uint8Array(32).fill(0x00);

    flush()
    {
        this.data.fill(0x00);
    }

    save(): Uint8Array
    {
        return this.data;
    }

    load(data: Uint8Array): void
    {
        this.data = new Uint8Array(data);
    }

    write8(address: number, value: number): void
    {
        address = address % 32;

        // Each 4th byte of the palettes are mirrored into each other
        // $3F10/$3F14/$3F18/$3F1C == $3F00/$3F04/$3F08/$3F0C
        if (address % 4 == 0 && address >= 16) {
            address -= 16;
        }

        this.data[address] = value;
    }

    read8(address: number): number
    {
        address = address % 32;
        if (address % 4 === 0 && address >= 16) {
            address -= 16;
        }
        return this.data[address];
    }
}

export type PpuMemorySaveData = [Uint8Array, Uint8Array, Uint8Array];

/**
 *
 *   Aka. VRAM
 *
 *   CHR: 0x0000 => 0x2000
 *   Nametable: 0x2000 => 0x3f00
 *   Background palette: 0x3F00 => 0x3F10
 *   Sprite palette: 0x3F00 => 0x3F20
 *
 */
export default class PpuMemory
{
    readonly nameTable: NameTable = new NameTable();
    readonly paletteTable: PaletteTable = new PaletteTable();
    readonly mapper: Mapper;

    // https://wiki.nesdev.com/w/index.php/PPU_OAM
    // Max 64 sprites
    // Byte 0 => Y position
    // Byte 1 => Bank nbr (address in mapper)
    // Byte 2 => Attributes (priority, hori. vert. switch)
    // Byte 3 => X position
    oam: Uint8Array = new Uint8Array(256).fill(0x00);

    constructor(mapper: Mapper)
    {
        this.mapper = mapper;
    }

    flush()
    {
        this.nameTable.flush();
        this.paletteTable.flush();
        this.oam.fill(0x00);
    }

    save(): PpuMemorySaveData
    {
        return [this.nameTable.save(), this.paletteTable.save(), this.oam];
    }

    load(data: PpuMemorySaveData): void
    {
        let [nameTable, paletteTable, oam] = data;
        this.nameTable.load(nameTable);
        this.paletteTable.load(paletteTable);
        this.oam = new Uint8Array(oam);
    }

    write8(address: number, value: number): void
    {
        address = address % 0x4000;
        if (address < 0x2000) {
            this.mapper.write8(address, value);
        } else if (address < 0x3f00) {
            this.nameTable.write8(this.mapper.mirrorType, address, value);
        } else if (address < 0x4000) {
            this.paletteTable.write8(address, value);
        } else {
            throw "Unknown PPU address " + address;
        }
    }

    readNametable(address: number)
    {
        address = address % 0x4000;
        return this.nameTable.read8(this.mapper.mirrorType, address);
    }

    read8(address: number): number
    {
        address = address % 0x4000;
        if (address < 0x2000) {
            return this.mapper.read8(address);
        } else if (address < 0x3f00) {
            return this.nameTable.read8(this.mapper.mirrorType, address);
        } else if (address < 0x4000) {
            this.paletteTable.read8(address);
        }
        throw new Error("Unknown PPU address " + address);
    }
}
