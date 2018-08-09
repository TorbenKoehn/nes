
import PpuMemory from "./PpuMemory";

import {
    Interrupt,
    RenderingMode,
    COLORS,
    ScanLineType,
    CycleType
} from "./Common";
import Mapper from "./mappers/Mapper";


export interface Sprite
{
    buffer: number[];
    x: number,
    priority: number,
    index: number
}


/**
 * Assign a RGBA color to the int8 array
 */
function setColorToBuffer(buffer: Uint8Array, i: number, color: number): void
{
    buffer[i] = (color >> 16) & 0xff;
    buffer[i + 1] = (color >> 8) & 0xff;
    buffer[i + 2] = color & 0xff;
    buffer[i + 3] = 0xff;
}

/**
 *  Helper method that appends a tile line to `tileData`
 *  by reading & concatenating lowTileByte, highTileByte and attributeTableByte.
 *  Must be called 8 times (or 16 for some sprites) to generate a sprite
 */
function readTileRow(
    tileData: number[],
    attributeTableByte: number,
    lowTileByte: number,
    highTileByte: number,
    isReversedHorizontally: boolean,
    flush: boolean
) {
    let tileShiftX = 0;
    let value = 0;

    if (flush) {
        tileData.length = 0;
    }

    for (let tileX = 0; tileX < 8; tileX++) {
        tileShiftX = isReversedHorizontally ? tileX : 7 - tileX;
        value =
            attributeTableByte |
            (((lowTileByte >> tileShiftX) & 1) |
                (((highTileByte >> tileShiftX) & 1) << 1));

        tileData.push(value);
    }
}


/**
 * Picture Processing Unit.
 * Handles graphics.
 */
export default class Ppu
{
    readonly memory: PpuMemory;
    readonly sprites: Sprite[] = new Array(8);

    cycle = 0;
    cycleType: CycleType = CycleType.ZERO;
    scanline = 261;
    scanlineType: ScanLineType = ScanLineType.PRELINE;
    interrupt: Interrupt|null = null;

    //
    // PPU registers
    // https://wiki.nesdev.com/w/index.php/PPU_scrolling#PPU_registers
    //

    // v & t are pointers used to point where to read & write to PPU memory (background)

    // current vram address (15 bit)
    v = 0;
    // temporary vram address (15 bit)
    // can also be thought of as the address of the top left onscreen tile.
    t = 0;
    // Y, used to help compute vram address
    y = 0;
    // fine x scroll (3 bit)
    x = 0;
    // write toggle (1 bit)
    w = 0;
    // even/odd frame flag (1 bit)
    f = 0;

    register = 0;

    // NMI flags (Non Maskable Interrupt) controls VBlank
    // https://wiki.nesdev.com/w/index.php/NMI
    nmiOccurred = 0;
    nmiOutput = 0;

    //
    // Containers holding bufferized data to display
    //

    // Background & Sprites temporary variables
    backgroundTileBuffer = [];
    lowTileByte = 0;
    highTileByte = 0;
    attributeTableByte = 0;
    spriteCount = 0;

    //
    // Registers
    //

    registerRead = 0;
    registerBuffer = 0;

    // 0x2000 PPUCTRL
    // Current nametable 0: $2000; 1: $2400; 2: $2800; 3: $2C00
    fNameTable = 0;
    // Increment vram of 1 or 32
    fIncrement = 0;
    // 0x0000 or 0x1000 (ignored in 8x16 mode)
    fSpriteTable = 0;
    // 0x0000 or 0x1000
    fBackgroundTable = 0;
    // 8x8 or 8x16
    fSpriteSize = 0;
    // Unused yet ?
    fMasterSlave = 0;

    // 0x2001 PPUMASK
    fGrayscale = 0; // 0: color; 1: grayscale
    fShowLeftBackground = 0; // 0: hide; 1: show
    fShowLeftSprites = 0; // 0: hide; 1: show
    fShowBackground = 0; // 0: hide; 1: show
    fShowSprites = 0; // 0: hide; 1: show
    // Unused
    fRedTint = 0; // 0: normal; 1: emphasized
    fGreenTint = 0; // 0: normal; 1: emphasized
    fBlueTint = 0; // 0: normal; 1: emphasized

    // 0x2002 PPUSTATUS

    // Set if sprite 0 overlaps background pixel
    fSpriteZeroHit = 0;
    fSpriteOverflow = 0;

    // 0x2003 OAMADDR
    tmpOamAddress = 0;
    oamAddress = 0;

    // 0x2007 PPUDATA
    bufferedData = 0; // for buffered reads

    // Pixel rendering variables
    backgroundColor = 0;
    spriteColor = 0;
    spriteIndex = 0;
    isBackgroundPixel = true;
    backgroundPixel = 0;
    spritePixel = 0;
    color = 0;

    frameReady = false;

    tileData: number[] = [];

    //
    // Debug data & variables
    //
    patternTable1 = new Uint8Array(160 * 160 * 4).fill(0xff);
    patternTable2 = new Uint8Array(160 * 160 * 4).fill(0xff); // 124 x 124 + 2px spacing
    oamTable = new Uint8Array(80 * 160 * 4); // 64 x 124 + 2 px spacing

    frameBuffer: Uint8Array = new Uint8Array(256 * 240 * 4);
    frameBackgroundBuffer: Uint8Array = new Uint8Array(256 * 240 * 4);
    frameSpriteBuffer: Uint8Array = new Uint8Array(256 * 240 * 4);
    frameColorBuffer: Uint32Array = new Uint32Array(256 * 240);

    patternTablesColors = [
        [0xff, 0xff, 0xff],
        [0x33, 0x33, 0x33],
        [0xbf, 0xbf, 0xbf],
        [0x00, 0x00, 0x00]
    ];

    renderingMode: RenderingMode = RenderingMode.NORMAL;

    constructor(mapper: Mapper)
    {
        this.memory = new PpuMemory(mapper);
        for (let i = 0; i < 8; i++) {
            this.sprites[i] = {
                buffer: [],
                x: 0,
                priority: 0,
                index: 0
            };
        }

        // Buffered data
        this.resetBuffers();
    }

    resetBuffers()
    {
        this.frameBuffer.fill(0x00);
        this.frameBackgroundBuffer.fill(0x00);
        this.frameSpriteBuffer.fill(0x00);
        this.frameColorBuffer.fill(0x00);
    }

    /**
     *  Used for debugging
     */
    private parsePatternTable(fromAddress: number, toAddress: number, patternTable: Uint8Array) : Uint8Array
    {
        let value = null;
        let lowTileData = 0;
        let highTileData = 0;
        let v = 0;
        let i = fromAddress;
        let y = 0;
        let z = 0;
        let s = 0;

        while (i < toAddress) {
            lowTileData = this.memory.read8(i);
            highTileData = this.memory.read8(i + 8);

            z = 0;
            while (z < 8) {
                value = (((lowTileData >> z) & 1) << 1) + ((highTileData >> z) & 1);
                v = (i % 8) * 160; // Tmp vertical position
                v += y * 160; // Permanent vertical position;
                v += 7 - z; // Tmp horizontal position
                v += (s % 16) * 10; // Permanent horizontal position
                v *= 4; // RGBA

                patternTable[v] = this.patternTablesColors[value][0];
                patternTable[v + 1] = this.patternTablesColors[value][1];
                patternTable[v + 2] = this.patternTablesColors[value][2];
                patternTable[v + 3] = 0xff;
                z++;
            }

            if (i % 256 === 0 && i > fromAddress) {
                y += 10; // 10 instead of 8 because need 2px spacing for display
            }

            i++;

            if (i % 8 == 0) {
                i += 8;
                s++;
            }
        }
        return patternTable;
    }

    getPatternTables()
    {
        return [
            this.parsePatternTable(0, 4096, this.patternTable1),
            this.parsePatternTable(4096, 8192, this.patternTable2)
        ];
    }

    getOamTable(): Uint8Array
    {
        let tile,
            table,
            spriteSize,
            attributes,
            address,
            lowTileData,
            highTileData,
            tileShiftX,
            tileShiftY,
            tableY,
            value,
            v,
            isReversedVertically,
            isReversedHorizontally;

        tableY = 0;

        // Not all sprites slots are used
        // We must flush it at each frame otherwhise we'll end up
        // with stale sprites
        this.oamTable.fill(0xff);

        for (let sprite = 0; sprite < 64; sprite++) {
            tile = this.memory.oam[sprite * 4 + 1];
            spriteSize = this.getSpriteSize();

            if (this.fSpriteSize === 0) {
                table = this.fSpriteTable;
            } else {
                table = tile & 1;
                tile = tile & 0xfe;
            }

            attributes = this.memory.oam[sprite * 4 + 2];
            address = 0x1000 * table + tile * 16;
            isReversedVertically = (attributes & 0x80) === 0x80;
            isReversedHorizontally = (attributes & 0x40) === 0x40;

            if (tile === 0) {
                // Unused sprite
                continue;
            }

            for (let tileY = 0; tileY < spriteSize; tileY++) {
                lowTileData = this.memory.read8(address);
                highTileData = this.memory.read8(address + 8);
                tileShiftY = isReversedVertically ? spriteSize - 1 - tileY : tileY;

                for (let tileX = 0; tileX < 8; tileX++) {
                    tileShiftX = isReversedHorizontally ? 7 - tileX : tileX;
                    value =
                        ((lowTileData >> tileShiftX) & 1) |
                        (((highTileData >> tileShiftX) & 1) << 1);
                    v = tileShiftY * 80; // Tmp vertical position
                    v += tableY * 80; // Permanent vertical position;
                    v += 7 - tileX; // Tmp horizontal position
                    v += (sprite % 8) * 8 + (sprite % 8) * 2; // Permanent horizontal position
                    v *= 4; // RGBA

                    this.oamTable[v] = this.patternTablesColors[value][0];
                    this.oamTable[v + 1] = this.patternTablesColors[value][1];
                    this.oamTable[v + 2] = this.patternTablesColors[value][2];
                    this.oamTable[v + 3] = 0xff;
                }

                address++;

                if (this.fSpriteSize !== 0 && tileY == 7) {
                    tile++;
                    address = 0x1000 * table + tile * 16;
                }
            }

            if (sprite % 8 === 0 && sprite > 0) {
                tableY += 18;
            }
        }

        return this.oamTable;
    }

    /**
     * Init methods, configuration
     */
    reset()
    {
        // Clean dat shit
        this.memory.flush();
        this.cycle = 0;
        this.scanline = 261;
        this.v = 0;
        this.t = 0;
        this.x = 0;
        this.w = 0;
        this.f = 0;
        this.register = 0;
        this.nmiOccurred = 0;
        this.nmiOutput = 0;
        this.lowTileByte = 0;
        this.highTileByte = 0;
        this.tileData = [];
        this.spriteCount = 0;
        this.fNameTable = 0;
        this.fIncrement = 0;
        this.fSpriteTable = 0;
        this.fBackgroundTable = 0;
        this.fSpriteSize = 0;
        this.fMasterSlave = 0;
        this.fGrayscale = 0;
        this.fShowLeftBackground = 0;
        this.fShowLeftSprites = 0;
        this.fShowBackground = 0;
        this.fShowSprites = 0;
        this.fRedTint = 0;
        this.fGreenTint = 0;
        this.fBlueTint = 0;
        this.fSpriteZeroHit = 0;
        this.fSpriteOverflow = 0;
        this.oamAddress = 0;
        this.bufferedData = 0;
        this.frameBuffer.fill(0x00);
        this.frameReady = false;
    }

    /*  Handles the read communication between Cpu and PPU */
    read8(address: number): number
    {
        switch (address) {
            case 0x2002:
                /**
                 * 0x2002: PPUSTATUS
                 * Used to describe the status of a PPU frame
                 * Note: Resets write toggle `w`
                 */
                this.registerRead = this.register & 0x1f;
                this.registerRead = this.registerRead | (this.fSpriteOverflow << 5);
                this.registerRead = this.registerRead | (this.fSpriteZeroHit << 6);
                if (this.nmiOccurred) {
                    // Avoid reading the NMI right after it is set
                    if (this.cycle !== 2 || this.scanline !== 241) {
                        this.registerRead = this.registerRead | (1 << 7);
                    }
                }
                this.nmiOccurred = 0;
                this.w = 0;
                return this.registerRead;
            case 0x2004:
                return this.memory.oam[this.oamAddress];
            case 0x2007:
                this.registerRead = this.memory.read8(this.v);
                // Emulate buffered reads
                if (this.v % 0x4000 < 0x3f00) {
                    this.registerBuffer = this.bufferedData;
                    this.bufferedData = this.registerRead;
                    this.registerRead = this.registerBuffer;
                } else {
                    this.bufferedData = this.memory.read8(this.v - 0x1000);
                }
                // Increment v address
                if (this.fIncrement === 0) {
                    this.v += 1;
                } else {
                    this.v += 32;
                }
                return this.registerRead;
        }
        return 0;
    }

    /* Handles the write communication between Cpu and PPU */
    write8(address: number, value: number): void
    {
        // Pointer to the last value written to a register
        // Used by PPUSTATUS (0x2002)
        this.register = value;
        switch (address) {
            case 0x2000:
                /**
                 * 0x2000: PPUCTR
                 * Sets 7 flags that control where/how the ROM data is read
                 */
                this.fNameTable = (value >> 0) & 3;
                this.fIncrement = (value >> 2) & 1;
                this.fSpriteTable = (value >> 3) & 1;
                this.fBackgroundTable = (value >> 4) & 1;
                this.fSpriteSize = (value >> 5) & 1;
                this.fMasterSlave = (value >> 6) & 1;
                this.nmiOutput = ((value >> 7) & 1) === 1 ? 1 : 0;
                this.t = (this.t & 0xf3ff) | ((value & 0x03) << 10);
                break;
            case 0x2001: {
                /**
                 * 0x2001: PPUMASK
                 * Sets 8 flags (1 byte) that control how to display pixels on screen
                 */
                this.fGrayscale = (value >> 0) & 1;
                this.fShowLeftBackground = (value >> 1) & 1;
                this.fShowLeftSprites = (value >> 2) & 1;
                this.fShowBackground = (value >> 3) & 1;
                this.fShowSprites = (value >> 4) & 1;
                this.fRedTint = (value >> 5) & 1;
                this.fGreenTint = (value >> 6) & 1;
                this.fBlueTint = (value >> 7) & 1;
                break;
            }
            case 0x2003:
                // 0x2003: OAMADDR
                this.oamAddress = value;
                break;
            case 0x2004:
                // 0x2004: OAMDATA (write)
                this.memory.oam[this.oamAddress] = value;
                this.oamAddress++;
                break;
            case 0x2005:
                /**
                 * 0x2005: PPUSCROLL
                 * Update the scroll variables, aka which pixel of the nametable will be
                 * at the top left of the screen
                 */
                if (this.w === 0) {
                    this.t = (this.t & 0xffe0) | (value >> 3);
                    this.x = value & 0x07;
                    this.w = 1;
                } else {
                    this.t = (this.t & 0x8fff) | ((value & 0x07) << 12);
                    this.t = (this.t & 0xfc1f) | ((value & 0xf8) << 2);
                    this.w = 0;
                }
                break;
            case 0x2006:
                if (this.w === 0) {
                    this.t = (this.t & 0x80ff) | ((value & 0x3f) << 8);
                    this.w = 1;
                } else {
                    this.t = (this.t & 0xff00) | value;
                    this.v = this.t;
                    this.w = 0;
                }
                break;
            case 0x2007:
                // 0x2007: PPUDATA
                this.memory.write8(this.v, value);
                if (this.fIncrement === 0) {
                    this.v += 1;
                } else {
                    this.v += 32;
                }
                break;
            case 0x4014:
                // 0x4014 is handled by the Cpu to avoid using cpu methods here
                break;
        }
    }

    //
    // https://wiki.nesdev.com/w/index.php/PPU_scrolling
    //
    private updateScrollingX()
    {
        // https://wiki.nesdev.com/w/index.php/PPU_scrolling#Coarse_X_increment
        // increment hori(v)
        // if coarse X === 31
        if ((this.v & 0x001f) === 31) {
            // coarse X = 0
            this.v = this.v & 0xffe0;
            // switch horizontal nametable
            this.v = this.v ^ 0x0400;
            return;
        }
        // increment coarse X
        this.v++;
    }

    private updateScrollingY()
    {
        // This one really is a mess
        // Values are coming from nesdev, don't touch, don't break
        switch (this.cycleType) {
            case CycleType.INCREMENT_Y:
                // https://wiki.nesdev.com/w/index.php/PPU_scrolling#Y_increment
                // increment vert(v)
                // if fine Y < 7
                if ((this.v & 0x7000) !== 0x7000) {
                    // increment fine Y
                    this.v += 0x1000;
                    break;
                }
                // fine Y = 0
                this.v = this.v & 0x8fff;
                // let y = coarse Y
                this.y = (this.v & 0x03e0) >> 5;
                if (this.y === 29) {
                    // coarse Y = 0
                    this.y = 0;
                    // switch vertical nametable
                    this.v = this.v ^ 0x0800;
                } else if (this.y === 31) {
                    // coarse Y = 0, nametable not switched
                    this.y = 0;
                } else {
                    // increment coarse Y
                    this.y++;
                }
                // put coarse Y back into v
                this.v = (this.v & 0xfc1f) | (this.y << 5);
                break;
            case CycleType.COPY_X:
                // https://wiki.nesdev.com/w/index.php/PPU_scrolling#At_dot_257_of_each_scanline
                this.v = (this.v & 0xfbe0) | (this.t & 0x041f);
                break;
        }
    }

    private setVerticalBlank()
    {
        this.nmiOccurred = 1;
    }

    /**
     * Called at the end of vertical blank
     * Prepares the PPU for next frame
     */
    private clearVerticalBlank()
    {
        this.nmiOccurred = 0;
        this.frameReady = true;
    }

    /**
     * Emulation related methods
     */

    private getSpriteSize()
    {
        return this.fSpriteSize ? 16 : 8;
    }

    /**
     * Returns the current background pixel
     * if background mode is enabled.
     *
     * This is where fine x is used as it points to
     * the correct bit of the current tile to use.
     */
    private getCurrentBackgroundPixel()
    {
        if (this.fShowBackground === 0) {
            return 0;
        }
        return this.backgroundTileBuffer[this.x] & 0x0f;
    }

    /**
     * Return the current sprite pixel
     * if sprite mode is enabled and there is a pixel to display.
     */
    private getCurrentSpritePixel()
    {
        let color, offset;
        if (this.fShowSprites === 0) {
            return [0, 0];
        }
        for (let i = 0; i < this.spriteCount; i++) {
            offset = this.cycle - 1 - this.sprites[i].x;
            if (offset < 0 || offset > 7) {
                continue;
            }

            color = this.sprites[i].buffer[offset] & 0x0f;

            if (color % 4 === 0) {
                continue;
            }
            return [i, color | 0x10];
        }
        return [0, 0];
    }

    private renderNormal(pos: number, colorPos: number, c: number)
    {
        setColorToBuffer(this.frameBuffer, colorPos, c);
    }

    private renderSplit(pos: number, colorPos: number, c: number)
    {
        this.frameColorBuffer[pos] = c;

        if (this.isBackgroundPixel) {
            setColorToBuffer(this.frameBackgroundBuffer, colorPos, c);
        } else {
            setColorToBuffer(this.frameSpriteBuffer, colorPos, c);
            setColorToBuffer(this.frameBackgroundBuffer, colorPos, 0x00);
        }
    }

    /**
     * Render either a background or sprite pixel or a black pixel
     * Executed 256 times per visible (240) scanline
     */
    private renderPixel()
    {
        let x = this.cycle - 1;
        let y = this.scanline;
        let pos = y * 256 + x;

        this.isBackgroundPixel = true;
        this.color = 0;
        this.backgroundColor =
            x < 8 && this.fShowLeftBackground === 0
                ? 0
                : this.getCurrentBackgroundPixel();

        [this.spriteIndex, this.spriteColor] =
            x < 8 && this.fShowLeftSprites === 0
                ? [0, 0]
                : this.getCurrentSpritePixel();

        // cf priority decision table https://wiki.nesdev.com/w/index.php/PPU_rendering
        // TODO: Looks like there's a display blinking bug on some games, cf Castlevania
        this.backgroundPixel = this.backgroundColor % 4;
        this.spritePixel = this.spriteColor % 4;

        if (this.backgroundPixel === 0 && this.spritePixel === 0) {
            this.color = 0;
        } else if (this.backgroundPixel === 0 && this.spritePixel !== 0) {
            this.color = this.spriteColor;
            this.isBackgroundPixel = false;
        } else if (this.backgroundPixel !== 0 && this.spritePixel === 0) {
            this.color = this.backgroundColor;
        } else {
            if (this.sprites[this.spriteIndex].index === 0 && x < 255) {
                this.fSpriteZeroHit = 1;
            }
            if (this.sprites[this.spriteIndex].priority === 0) {
                this.color = this.spriteColor;
                this.isBackgroundPixel = false;
            } else {
                this.color = this.backgroundColor;
            }
        }

        // Fills the buffer at pos `x`, `y` with rgb color `c`
        switch (this.renderingMode) {
            case RenderingMode.NORMAL:
                this.renderNormal(pos, pos * 4, COLORS[this.memory.paletteTable.read8(this.color)]);
                break;
            case RenderingMode.SPLIT:
                this.renderSplit(pos, pos * 4, COLORS[this.memory.paletteTable.read8(this.color)]);
                break;
        }
    }

    private fetchSpriteRow(tileData: number[], i: number, row: number)
    {
        // Sub function of fetchAndStoreSprites
        let tile = this.memory.oam[i * 4 + 1];
        let attributes = this.memory.oam[i * 4 + 2];
        let address,
            table = 0;
        let isReversedVertically = (attributes & 0x80) === 0x80;
        let isReversedHorizontally = (attributes & 0x40) === 0x40;
        let attributeTableByte = (attributes & 3) << 2;
        let spriteSize = this.getSpriteSize();

        if (this.fSpriteSize === 0) {
            table = this.fSpriteTable;
        } else {
            table = tile & 1;
            tile = tile & 0xfe;
        }

        row = isReversedVertically ? spriteSize - 1 - row : row;

        if (row > 7) {
            tile++;
            row = row % 8;
        }

        address = 0x1000 * table + tile * 16 + row;

        this.lowTileByte = this.memory.read8(address);
        this.highTileByte = this.memory.read8(address + 8);

        readTileRow(
            tileData,
            attributeTableByte,
            this.lowTileByte,
            this.highTileByte,
            isReversedHorizontally,
            true
        );
    }

    /**
     * Retrieves the sprites that are to be rendered on the next scanline
     * Executed at the end of a scanline
     */
    private fetchAndStoreSpriteRows()
    {
        let y, attributes, row;
        this.spriteCount = 0;
        let spriteSize = this.getSpriteSize();

        for (let i = 0; i < 64; i++) {
            y = this.memory.oam[i * 4];
            row = this.scanline - y;

            if (row < 0 || row >= spriteSize) {
                continue;
            }

            if (this.spriteCount < 8) {
                attributes = this.memory.oam[i * 4 + 2];

                this.fetchSpriteRow(this.sprites[this.spriteCount].buffer, i, row);
                this.sprites[this.spriteCount].x = this.memory.oam[i * 4 + 3];
                this.sprites[this.spriteCount].priority = (attributes >> 5) & 1;
                this.sprites[this.spriteCount].index = i;
            }
            this.spriteCount++;

            if (this.spriteCount > 8) {
                this.spriteCount = 8;
                this.fSpriteOverflow = 1;
                break;
            }
        }
    }

    /**
     * Actions that should be done over 8 ticks
     * but instead done into 1 call because YOLO.
     *
     * Retrieves the background tiles that are to be rendered on the next X bytes
     *
     * - Read the nametable byte using current `v`
     * - Fetch corresponding attribute byte using current `v`
     * - Read CHR/Pattern table low+high bytes
     */
    private fetchAndStoreBackgroundRow()
    {
        // Fetch Name Table Byte
        let address = 0x2000 | (this.v & 0x0fff),
            shift,
            fineY,
            nameTableByte = this.memory.read8(address);

        // Fetch Attribute Table Byte
        address =
            0x23c0 |
            (this.v & 0x0c00) |
            ((this.v >> 4) & 0x38) |
            ((this.v >> 2) & 0x07);
        shift = ((this.v >> 4) & 4) | (this.v & 2);
        this.attributeTableByte = ((this.memory.read8(address) >> shift) & 3) << 2;

        // Fetch Low Tile Byte
        fineY = (this.v >> 12) & 7;
        address = 0x1000 * this.fBackgroundTable + nameTableByte * 16 + fineY;
        this.lowTileByte = this.memory.read8(address);

        // Fetch High Tile Byte
        fineY = (this.v >> 12) & 7;
        address = 0x1000 * this.fBackgroundTable + nameTableByte * 16 + fineY;
        this.highTileByte = this.memory.read8(address + 8);

        // Store Tile Data
        readTileRow(
            this.backgroundTileBuffer,
            this.attributeTableByte,
            this.lowTileByte,
            this.highTileByte,
            false,
            false
        );
    }

    /**
     * Determines the type of the cycle
     * Refer to https://wiki.nesdev.com/w/images/d/d1/Ntsc_timing.png
     */
    private getCycleType(): CycleType
    {
        if (this.cycle === 0) {
            return CycleType.ZERO;
        } else if (this.cycle === 1) {
            return CycleType.ONE;
        } else if (this.cycle > 1 && this.cycle < 257) {
            return CycleType.VISIBLE;
        } else if (this.cycle === 321) {
            return CycleType.FLUSH_TILEDATA;
        } else if (this.cycle > 321 && this.cycle < 337) {
            return CycleType.PREFETCH;
        } else if (this.cycle === 259) {
            return CycleType.SPRITES;
        } else if (this.cycle === 258) {
            return CycleType.INCREMENT_Y;
        } else if (this.cycle === 257) {
            return CycleType.COPY_X;
        } else if (this.cycle > 279 && this.cycle < 305) {
            return CycleType.COPY_Y;
        } else if (this.cycle == 340) {
            return CycleType.MAPPER_TICK;
        }
        return CycleType.IDLE;
    }

    /**
     * Determines the type of the scanline
     */
    private getScanLineType(): ScanLineType
    {
        if (this.scanline < 240) {
            return ScanLineType.VISIBLE;
        } else if (this.scanline === 241) {
            return ScanLineType.VBLANK;
        } else if (this.scanline === 261) {
            return ScanLineType.PRELINE;
        }
        return ScanLineType.IDLE;
    }

    private doPreline(): Interrupt|null
    {
        if (this.cycleType === CycleType.ONE
            || this.cycleType === CycleType.VISIBLE
            || this.cycleType === CycleType.PREFETCH) {
            this.backgroundTileBuffer.shift();

            if (this.cycle % 8 === 0) {
                if (this.cycle < 256) {
                    this.fetchAndStoreBackgroundRow();
                }
                this.updateScrollingX();
            }
        }

        if (this.cycleType === CycleType.SPRITES) {
            this.spriteCount = 0;
        }

        if (this.cycleType === CycleType.COPY_Y) {
            // https://wiki.nesdev.com/w/index.php/PPU_scrolling#During_dots_280_to_304_of_the_pre-render_scanline_.28end_of_vblank.29
            this.v = (this.v & 0x841f) | (this.t & 0x7be0);
        }

        this.updateScrollingY();

        if (this.cycleType == CycleType.ONE) {
            this.clearVerticalBlank();
        }

        if (this.cycleType === CycleType.MAPPER_TICK) {
            if (this.memory.mapper.tick()) {
                return Interrupt.IRQ;
            }
        }
        return null;
    }

    private doVisibleLine(): Interrupt|null
    {
        if (this.cycleType === CycleType.ONE || this.cycleType === CycleType.VISIBLE) {
            this.renderPixel();
        }

        if (this.cycleType === CycleType.VISIBLE) {
            this.backgroundTileBuffer.shift();

            if (this.cycle % 8 === 0) {
                if (this.cycle < 256) {
                    this.fetchAndStoreBackgroundRow();
                }
                this.updateScrollingX();
            }
        } else if (this.cycleType === CycleType.FLUSH_TILEDATA) {
            // Hackish hack, empty the remaining tile data at the beginning of prefetch
            // Needs improvement
            this.backgroundTileBuffer.length = 0;
        } else if (this.cycleType === CycleType.PREFETCH) {
            if (this.cycle % 8 === 0) {
                this.fetchAndStoreBackgroundRow();
                this.updateScrollingX();
            }
        }

        this.updateScrollingY();

        if (this.cycleType === CycleType.SPRITES) {
            this.fetchAndStoreSpriteRows();
        }

        if (this.cycleType === CycleType.MAPPER_TICK) {
            if (this.memory.mapper.tick()) {
                return Interrupt.IRQ;
            }
        }

        return null;
    }

    private doVBlankLine(): Interrupt|null
    {
        if (this.cycleType === CycleType.SPRITES) {
            this.spriteCount = 0;
        }

        // Vertical Blank is set at second tick of scanline 241
        if (this.cycleType === CycleType.ONE) {
            this.setVerticalBlank();
            if (this.nmiOutput) {
                return Interrupt.NMI; // Clean this shit
            }
        }

        return null;
    }

    private incrementCounters()
    {
        this.cycle++;

        // Skip one cycle when background is on for each odd frame
        if (this.scanline === 261
            && this.cycle === 340
            && this.fShowBackground !== 0
            && this.f === 1) {
            this.cycle++;
            this.f = this.f ^ 1;
        }

        if (this.cycle == 341) {
            this.cycle = 0;
            this.scanline++;
            if (this.scanline == 262) {
                this.scanline = 0;
            }
        }
    }

    /**
     * Main function of PPU.
     * Increments counters (cycle, scanline, frame)
     * Executes one action based on scanline + cycle
     */
    tick(): Interrupt|null
    {
        this.cycleType = this.getCycleType();
        this.scanlineType = this.getScanLineType();

        if (this.scanlineType === ScanLineType.VBLANK) {
            this.interrupt = this.doVBlankLine();
        } else if (this.fShowBackground !== 0 || this.fShowSprites !== 0) {
            if (this.scanlineType === ScanLineType.PRELINE) {
                this.interrupt = this.doPreline();
            } else if (this.scanlineType === ScanLineType.VISIBLE) {
                this.interrupt = this.doVisibleLine();
            }
        } else {
            this.interrupt = null;
        }

        this.incrementCounters();
        return this.interrupt;
    }

    acknowledgeFrame(): void
    {
        // Must be called by code handling the NES
        this.frameReady = false;

        if (this.fShowSprites === 1) {
            this.fSpriteOverflow = 0;
            this.fSpriteZeroHit = 0;
        }

        this.frameBackgroundBuffer.fill(0x00);
        this.frameSpriteBuffer.fill(0x00);
    }
}
