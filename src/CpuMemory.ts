
export type CpuMemorySaveData = [Uint8Array, Uint8Array, Uint8Array];

/**
 * Cpu RAM: 0x0000 => 0x2000
 */
export default class CpuMemory
{
    zp: Uint8Array = new Uint8Array(256).fill(0xff);
    stack: Uint8Array = new Uint8Array(256).fill(0xff);
    ram: Uint8Array = new Uint8Array(1536).fill(0xff);

    save(): CpuMemorySaveData
    {
        return [this.zp, this.stack, this.ram];
    }

    load(data: CpuMemorySaveData): void
    {
        let [zp, stack, ram] = data;
        this.zp = new Uint8Array(zp);
        this.stack = new Uint8Array(stack);
        this.ram = new Uint8Array(ram);
    }

    read8(address: number)
    {
        // 2k bits RAM
        // mirrored 4 times
        address = address % 0x800;
        if (address < 0x100) {
            return this.zp[address];
        } else if (address < 0x200) {
            return this.stack[address - 0x100];
        } else {
            return this.ram[address - 0x200];
        }
    }

    write8(address: number, value: number)
    {
        // 2k bits RAM
        // mirrored 4 times
        address = address % 0x800;
        if (address < 0x0100) {
            this.zp[address] = value;
        } else if (address < 0x0200) {
            this.stack[address - 0x100] = value;
        } else {
            this.ram[address - 0x200] = value;
        }
    }
}
