
import Mapper from "./Mapper";
import Rom from "../Rom";
import {MirrorType} from "../PpuMemory";

const MMC1_MIRRORS = [
    MirrorType.SINGLE_SCREEN,
    MirrorType.SINGLE_SCREEN_2,
    MirrorType.VERTICAL,
    MirrorType.HORIZONTAL
];

/**
 * http://wiki.nesdev.com/w/index.php/MMC1
 */
export default class Mmc1 extends Mapper
{
    buffer = 0x10;
    bufferIndex = 0;
    conf = 0x0c;
    prgBankMode = 0;
    chrBankMode = 0;

    constructor(rom: Rom)
    {
        super(rom);
        this.prg.switchBank(0x4000, 0x8000, this.prg.bankNbr / 16 - 1);
    }

    read8(address: number): number
    {
        if (address < 0x2000) {
            return this.chr.read8(address);
        } else if (address < 0x8000) {
            return this.sram[address - 0x6000];
        }
        return this.prg.read8(address - 0x8000);
    }

    /**
     *  MMC1 has an internal buffer which needs to be written 5 times before switching banks or
     *  updating registers
     */
    write8(address: number, value: number): void
    {
        if (address < 0x2000) {
            this.chr.write8(address, value);
        } else if (address < 0x8000) {
            this.sram[address - 0x6000] = value;
        } else {
            if ((value & 0x80) != 0) {
                this.buffer = 0x10;
                this.bufferIndex = 0;
                this.control(this.conf | 0x0c);
            } else {
                // Write Register
                this.buffer = (this.buffer >> 1) | ((value & 1) << 4);
                this.bufferIndex++;

                if (this.bufferIndex == 5) {
                    value = this.buffer;

                    // Control
                    if (address < 0xa000) {
                        this.control(value);
                    }

                    // CHR Bank 0
                    else if (address < 0xc000) {
                        if (!this.chr.fixed) {
                            this.chr.switchBank(0, 0x1000, value);
                        } else {
                            this.chr.switchBank(0, 0x2000, value >> 1);
                        }
                    }

                    // CHR Bank 1
                    else if (address < 0xe000) {
                        if (!this.chr.fixed) {
                            //this.chr.updateUpperBank(value);
                            this.chr.switchBank(0x1000, 0x2000, value);
                        }
                    }

                    // PRG Bank
                    else {
                        if (this.prg.fixed) {
                            this.prg.switchBank(0, 0x8000, value >> 1);
                        } else {
                            if (this.prg.swapMode === 0) {
                                this.prg.switchBank(0, 0x4000, 0);
                                this.prg.switchBank(0x4000, 0x8000, value);
                            } else {
                                this.prg.switchBank(0, 0x4000, value);
                                this.prg.switchBank(0x4000, 0x8000, this.prg.bankNbr / 16 - 1);
                            }
                        }
                    }

                    this.buffer = 0x10;
                    this.bufferIndex = 0;
                }
            }
        }
    }

    private control(value: number): void
    {
        this.conf = value;
        this.prgBankMode = (value >> 2) & 3;
        this.chrBankMode = (value >> 4) & 1;
        this.mirrorType = MMC1_MIRRORS[value & 3];

        if (this.prgBankMode === 2) {
            this.prg.swapMode = 0;
        }
        if (this.prgBankMode === 3) {
            this.prg.swapMode = 1;
        }

        this.prg.fixed = this.prgBankMode === 0 || this.prgBankMode === 1;
        this.chr.fixed = this.chrBankMode === 0;
    }
}
