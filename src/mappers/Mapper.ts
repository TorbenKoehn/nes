
import BankMemory from "./BankMemory";
import {MirrorType} from "../PpuMemory";
import Rom from "../Rom";

/**
 * http://wiki.nesdev.com/w/index.php/Mapper
 */
export default class Mapper
{
    readonly chr: BankMemory;
    readonly prg: BankMemory;
    readonly sram = new Array(0x2000).fill(0xff);

    mirrorType: MirrorType;

    constructor(rom: Rom)
    {
        this.chr = new BankMemory(rom.chr, 0x2000, true);
        this.prg = new BankMemory(rom.prg, 0x8000, false);
        this.sram = new Array(0x2000).fill(0xff);
        this.mirrorType = rom.mirrorType;
    }

    read8(address: number): number
    {
        return 0;
    }

    write8(address: number, value: number): void
    {
    }

    /**
     *  Only used for a few mappers
     */
    tick()
    {
    }
}
