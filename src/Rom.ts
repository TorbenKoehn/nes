
import Nrom from "./mappers/Nrom";
import Mmc1 from "./mappers/Mmc1";
import Mmc3 from "./mappers/Mmc3";
import UxRom from "./mappers/UxRom";
import Mapper from "./mappers/Mapper";
import {MirrorType} from "./PpuMemory";

const HEADER_SIZE = 16;
const PRG_BANK_SIZE = 16384;
const CHR_BANK_SIZE = 8192;
const ROM_MAPPERS = [Nrom, Mmc1, UxRom, Mmc3];

export default class Rom
{
    readonly header: Uint8Array;
    readonly nbrPRGBanks: number;
    readonly nbrCHRBanks: number;
    readonly mapperType: number;
    readonly mirrorType: MirrorType;
    // 0: NTSC, 1: PAL
    readonly region: number;
    readonly prg: Uint8Array;
    readonly chr: Uint8Array;
    readonly mapper: Mapper;

    /**
     * Parse a .nes file according to the INES file format
     * http://wiki.nesdev.com/w/index.php/INES
     * https://wiki.nesdev.com/w/index.php/CHR_ROM_vs._CHR_RAM

     * CHR => Pattern tables, the raw data to render by the PPU
     * PRG => The program, used by the Cpu
     */
    constructor(buffer: Uint8Array)
    {
        let p = 0;
        this.header = buffer.subarray(p, HEADER_SIZE);

        p += HEADER_SIZE;

        this.nbrPRGBanks = this.header[4];
        this.nbrCHRBanks = this.header[5];
        // Cf below for types
        this.mapperType = (this.header[6] >> 4) | ((this.header[7] >> 4) << 4);
        // Type will depend on the mapper, check mapper classes
        this.mirrorType = (this.header[6] & 1) | (((this.header[6] >> 3) & 1) << 1);
        // 0: NTSC, 1: PAL
        this.region = this.header[9] & 1;

        let prgLength = this.nbrPRGBanks * PRG_BANK_SIZE;
        let chrLength = this.nbrCHRBanks * CHR_BANK_SIZE;

        this.prg = buffer.subarray(p, p + prgLength);

        p += prgLength;

        if (chrLength > 0) {
            this.chr = buffer.subarray(p, p + chrLength);
        } else {
            this.chr = new Uint8Array(CHR_BANK_SIZE).fill(0);
        }

        let romMapper = ROM_MAPPERS[this.mapperType];
        if (!romMapper) {
            throw new Error('Invalid ROM mapper ' + this.mapperType);
        }
        this.mapper = new romMapper(this);
    }
}
