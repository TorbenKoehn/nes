
import Mapper from "./Mapper";
import Rom from "../Rom";

/**
 *   http://wiki.nesdev.com/w/index.php/NROM
 */
export default class Nrom extends Mapper
{
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

    write8(address: number, value: number): void
    {
        if (address < 0x2000) {
            this.chr.write8(address, value);
        } else if (address < 0x8000) {
            this.sram[address - 0x6000] = value;
        } else {
            console.warn("Invalid write address", address);
        }
    }
}
